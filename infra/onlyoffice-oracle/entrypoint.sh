#!/usr/bin/env bash
set -euo pipefail

interval="${ARLES_AUTOSAVE_INTERVAL:-1m}"
if [[ ! "$interval" =~ ^[1-9][0-9]*m$ ]]; then
  echo "ARLES_AUTOSAVE_INTERVAL debe expresarse en minutos enteros positivos." >&2
  exit 1
fi
export ARLES_AUTOSAVE_INTERVAL="$interval"

# Mantiene los valores originales de local.json, incluidos SQL y JWT.
# El arranque oficial completa su configuracion y habilita los servicios.
config=/etc/onlyoffice/documentserver/local.json
json=/var/www/onlyoffice/documentserver/npm/json
if [[ ! -f "$config" || ! -x "$json" ]]; then
  echo "No se encontro la configuracion de la imagen oficial de ONLYOFFICE." >&2
  exit 1
fi
"$json" -q -f "$config" -I -e '
  this.services = this.services || {};
  this.services.CoAuthoring = this.services.CoAuthoring || {};
  this.services.CoAuthoring.autoAssembly = {
    enable: true,
    interval: process.env.ARLES_AUTOSAVE_INTERVAL,
    step: "1m"
  };
'

exec /app/ds/run-document-server.sh "$@"
