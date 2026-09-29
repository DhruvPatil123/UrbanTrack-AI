.PHONY: setup test lint format seed demo train-gnn evaluate run-backend run-frontend clean

setup:
	pip install -e .
	npm install

test:
	pytest tests/ -v

lint:
	flake8 ai/ backend/ || true
	npm run lint

format:
	black ai/ backend/ tests/ scripts/ || true

seed:
	python3 scripts/seed_demo_data.py

demo:
	python3 scripts/run_pipeline.py --demo

train-gnn:
	python3 scripts/train_gnn.py --epochs 20

evaluate:
	python3 scripts/evaluate_gnn.py

run-backend:
	uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

run-frontend:
	npm run dev

clean:
	rm -rf dist build *.egg-info .pytest_cache __pycache__ */__pycache__
