FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure persistent document storage directory exists
RUN mkdir -p storage

ENV PORT=8000
ENV ENV=production

EXPOSE 8000

CMD ["python", "main.py"]
