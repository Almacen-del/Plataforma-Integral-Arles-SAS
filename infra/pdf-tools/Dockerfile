FROM python:3.12-slim-bookworm@sha256:9901e0a8d75037d8242ed43155cbcb2d1f61be1356383d8054afb59fd50e39c4
RUN apt-get update && apt-get install -y --no-install-recommends ghostscript=10.0.0~dfsg-11+deb12u8 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY service.py /app/service.py
USER 65534:65534
EXPOSE 8080
CMD ["python3", "-u", "/app/service.py"]
