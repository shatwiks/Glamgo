# ==============================================================================
# GlamGo PaaS Procfile (Railway / Heroku / Dokku / Render Native)
# ==============================================================================
release: alembic upgrade head
web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:${PORT:-8000} --timeout 60 backend.app.main:app
