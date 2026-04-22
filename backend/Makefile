.PHONY: test test-watch install-test-deps

.venv:
	python3 -m venv .venv
	.venv/bin/pip install -q -r requirements.txt

install-test-deps: .venv

test: .venv
	.venv/bin/pytest tests/ -v

test-scoring: .venv
	.venv/bin/pytest tests/test_scoring.py -v

test-api: .venv
	.venv/bin/pytest tests/test_api.py -v
