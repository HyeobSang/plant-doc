import json
import base64
import io
from PIL import Image
import numpy as np
import torch
import cv2
from ultralytics import YOLO
import os

# YOLO 모델 로드 (실제 모델 파일이 필요)
# model = YOLO('runs/detect/train/weights/best.pt')

def handler(event, context):
    try:
        # CORS 헤더 설정
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
        
        # OPTIONS 요청 처리 (CORS preflight)
        if event['httpMethod'] == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # POST 요청 처리
        if event['httpMethod'] != 'POST':
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
        
        # 요청 데이터 파싱
        body = json.loads(event['body'])
        image_data = body.get('image')
        plant_name = body.get('plantName', 'Unknown Plant')
        
        if not image_data:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'No image provided'})
            }
        
        # 이미지 디코딩
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # 임시 응답 (실제 AI 모델이 없으므로)
        result = {
            'status': 'success',
            'severity_level': 'Mild',
            'severity_ratio': 25,
            'issues': [
                {
                    'label': 'Powdery Mildew',
                    'confidence': 0.75
                }
            ],
            'prescription_text': f'{plant_name}에 가벼운 흰가루병 증상이 감지되었습니다. 베이킹소다수를 주 1회 살포하고 환기를 개선해주세요.',
            'annotated_image': image_data  # 원본 이미지 반환
        }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Server error: {str(e)}'})
        }
