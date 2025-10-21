from flask import Flask, request, jsonify
from flask_cors import CORS 
from ultralytics import YOLO
from PIL import Image
import io
import os
import numpy as np
import base64
import traceback
import json
import torch

# PyTorch 2.6+ 보안 설정 우회
import ultralytics
torch.serialization.add_safe_globals([ultralytics.nn.tasks.DetectionModel])

# 대안: torch.load를 직접 수정 (더 확실한 방법)
original_torch_load = torch.load
def patched_torch_load(*args, **kwargs):
    kwargs.setdefault('weights_only', False)
    return original_torch_load(*args, **kwargs)
torch.load = patched_torch_load

app = Flask(__name__)
# CORS 설정: React 프론트엔드와 통신을 위해 필수 (개발 환경용)
CORS(app, origins="*", supports_credentials=True)

# YOLO 모델 로드 (서버 시작 시점에 한 번만 로드)
MODEL_PATH = 'runs/detect/train/weights/best.pt'
try:
    model = YOLO(MODEL_PATH)
    print("YOLO Model loaded successfully.")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    exit()

# -------------------------------------------------------------
# 핵심 진단 API 엔드포인트
# -------------------------------------------------------------

@app.route('/api/diagnose', methods=['POST'])
def diagnose_plant():
    try:
        # React에서 FormData로 전송된 데이터 처리
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        image_file = request.files['image']
        plant_name = request.form.get('plantName', 'Unknown Plant')
        
        # 1. 이미지 파일 로드
        image_data = image_file.read()
        # 이미지를 PIL.Image 객체로 변환
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # 2. YOLO 진단 실행
        results = model.predict(source=image, conf=0.25, verbose=False)
        
        # 3. 심각도 및 결과 추출 로직 실행
        diagnosis_result = process_yolo_results(results, plant_name, image)
        
        return jsonify(diagnosis_result), 200

    except Exception as e:
        print(f"Diagnosis Error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Internal server error during diagnosis"}), 500

# 헬스 체크 엔드포인트
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model_loaded": model is not None}), 200

# -------------------------------------------------------------
# 심각도 로직 함수 (JSON 직렬화 및 이미지 인코딩 포함)
# -------------------------------------------------------------

def process_yolo_results(yolo_results, plant_name, original_image):
    """
    YOLO 결과를 처리하고, 결과 이미지를 Base64로 인코딩하여 반환하는 함수
    """
    
    # 1. 클래스 이름 정의 (data.yaml과 순서 일치)
    class_names = ['Powdery Mildew', 'Septoria_leaf_spot']
    
    # 2. 결과 추출 및 심각도 계산 준비
    total_image_area = 640 * 640  # YOLO imgsz=640 기준으로 가정
    total_lesion_area = 0
    detected_issues = []
    
    # 3. 탐지 결과 (boxes) 추출
    boxes_data = []
    if yolo_results and len(yolo_results) > 0:
        r = yolo_results[0]
        if r.boxes:
            boxes = r.boxes.xyxy.cpu().numpy()
            classes = r.boxes.cls.cpu().numpy()
            confs = r.boxes.conf.cpu().numpy()
        
            for box, cls_id, conf in zip(boxes, classes, confs):
                
                # 병변 면적 계산
                x_min, y_min, x_max, y_max = box
                width = x_max - x_min
                height = y_max - y_min
                lesion_area = width * height
                
                total_lesion_area += lesion_area
                
                # JSON 직렬화 오류 해결 (모든 숫자를 표준 Python 타입으로 변환)
                detected_issues.append({
                    "class_id": int(cls_id), 
                    "label": class_names[int(cls_id)],
                    "confidence": float(conf), 
                    "box": [float(b) for b in box], 
                    "area": float(lesion_area)
                })
                boxes_data.append(r)
    
    # 4. 심각도 비율 계산
    if total_image_area == 0 or total_lesion_area == 0:
        severity_ratio = 0.0
    else:
        severity_ratio = (total_lesion_area / total_image_area) * 100 
    
    # 5. 심각도 단계 결정 (규칙 기반 로직)
    severity_level = "Healthy"
    if severity_ratio > 20:
        severity_level = "Severe" 
    elif severity_ratio > 5:
        severity_level = "Moderate" 
    elif severity_ratio > 0:
        severity_level = "Mild" 
    
    if total_lesion_area == 0:
        prescription_text = "식물이 건강한 상태입니다. 현재 병변은 감지되지 않았습니다."
    else:
        main_issue = detected_issues[0]['label'] if detected_issues else 'Unknown'
        prescription_text = f"{main_issue} 감염이 감지되었습니다. 심각도: {severity_level} ({severity_ratio:.1f}%)"

    # 6. 진단 결과 이미지 생성 및 Base64 인코딩
    if boxes_data:
        # 경계 상자가 그려진 이미지 (YOLO의 plot 기능 사용)
        annotated_image_np = yolo_results[0].plot() 
        annotated_image = Image.fromarray(annotated_image_np)
    else:
        # 탐지 결과가 없을 경우 (Healthy), 원본 이미지를 그대로 사용
        annotated_image = original_image
        
    # 이미지를 메모리(바이트 스트림)에 JPEG 포맷으로 저장
    buffered = io.BytesIO()
    # 압축 품질을 높여 전송 속도/파일 크기 균형 맞춤
    annotated_image.save(buffered, format="JPEG", quality=85) 
    
    # Base64 문자열로 인코딩
    encoded_image = base64.b64encode(buffered.getvalue()).decode('utf-8')

    # 7. 최종 결과 반환
    return {
        "status": "success",
        "severity_level": severity_level,
        "severity_ratio": round(float(severity_ratio), 2),
        "issues": detected_issues,
        "prescription_text": prescription_text,
        "annotated_image": encoded_image # Base64 이미지 데이터
    }

# -------------------------------------------------------------
# 서버 실행
# -------------------------------------------------------------

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')