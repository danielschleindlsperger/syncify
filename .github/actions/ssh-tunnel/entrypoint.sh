#!/bin/sh -l

set -eu

echo "Opening SSH tunnel to ${INPUT_SSH_TUNNEL_DESTINATION}"
sshpass -p "${INPUT_SSH_TUNNEL_PASSWORD}" sh -c 'ssh -fNT -o StrictHostKeyChecking=no -L "${INPUT_SSH_TUNNEL_MAPPING}" "${INPUT_SSH_TUNNEL_DESTINATION}" -p "${INPUT_SSH_TUNNEL_PORT}" && sleep 2'

