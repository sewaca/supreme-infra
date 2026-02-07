#!/bin/bash

# Скрипт для генерации самоподписного TLS сертификата

CERT_DIR="./certs"
NAMESPACE="default"
SECRET_NAME="supreme-tls-cert"
DOMAIN="supreme.local"

# Создаем директорию для сертификатов
mkdir -p "$CERT_DIR"

echo "Генерация самоподписного сертификата для $DOMAIN..."

# Генерируем приватный ключ
openssl genrsa -out "$CERT_DIR/tls.key" 2048

# Генерируем сертификат
openssl req -new -x509 -key "$CERT_DIR/tls.key" -out "$CERT_DIR/tls.crt" -days 365 \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=Supreme/OU=IT/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,DNS:*.$DOMAIN"

echo "Сертификат создан в $CERT_DIR/"
echo ""
echo "Для создания Kubernetes Secret выполните:"
echo "kubectl create secret tls $SECRET_NAME --cert=$CERT_DIR/tls.crt --key=$CERT_DIR/tls.key -n $NAMESPACE"
echo ""
echo "Или используйте существующий шаблон tls-secret.yaml с base64-кодированными значениями:"
echo "tls.crt: $(cat $CERT_DIR/tls.crt | base64 | tr -d '\n')"
echo "tls.key: $(cat $CERT_DIR/tls.key | base64 | tr -d '\n')"
