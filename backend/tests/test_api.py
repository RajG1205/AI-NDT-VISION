from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get('/api/v1/health')
    assert response.status_code == 200
    assert 'model_loaded' in response.json()

def test_invalid_confidence():
    response = client.post('/api/v1/predict', params={'confidence': 2})
    assert response.status_code == 422
