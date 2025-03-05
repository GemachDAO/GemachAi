#!/bin/bash

# Check if required arguments are provided
if [ "$#" -lt 4 ]; then
  echo "Usage: $0 <protocol_name> <description> <chain_ids> <actions>"
  echo "Example: $0 'myprotocol' 'My protocol description' '1,2,3' 'SWAP,BRIDGE'"
  exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"

PROTOCOL_NAME=$1
DESCRIPTION=$2
CHAIN_IDS=$3
ACTIONS=$4

# Convert protocol name to PascalCase for class name
CLASS_NAME=$(echo "$PROTOCOL_NAME" | sed -E 's/(^|_)([a-z])/\U\2/g')

# Convert actions to ProtocolActionEnum format
FORMATTED_ACTIONS=$(echo "$ACTIONS" | sed 's/\([^,]*\)/ProtocolActionEnum.Enum.\1/g')

# Create protocol directory if it doesn't exist
mkdir -p "${API_DIR}/src/protocols/${PROTOCOL_NAME}"

# Create protocol service file
cat >"${API_DIR}/src/protocols/${PROTOCOL_NAME}/${PROTOCOL_NAME}.service.ts" <<EOF
import { Injectable } from '@nestjs/common';
import { BaseProtocol } from '../base/base-protocol';
import { Protocol, SupportedActions } from '../decorators/action-registry';
import { ProtocolActionEnum, ChainId } from '../../types';
import { BaseChainService } from '../base/base-chain.service';
import { TokensService } from '../../tokens/tokens.service';

@Injectable()
@Protocol({
  name: '${PROTOCOL_NAME}',
  description: '${DESCRIPTION}',
  supportedChainIds: [${CHAIN_IDS}],
})
@SupportedActions(${FORMATTED_ACTIONS})
export class ${CLASS_NAME}Service extends BaseProtocol {
  constructor(
    private readonly baseChainService: BaseChainService,
    private readonly tokensService: TokensService,
  ) {
    super();
  }

  async getUserData(address: string): Promise<any> {
    return null;
  }
}
EOF

# Create protocol module file
cat >"${API_DIR}/src/protocols/${PROTOCOL_NAME}/${PROTOCOL_NAME}.module.ts" <<EOF
import { Module } from '@nestjs/common';
import { ${CLASS_NAME}Service } from './${PROTOCOL_NAME}.service';
import { BaseChainService } from '../base/base-chain.service';
import { TokensService } from '../../tokens/tokens.service';

@Module({
  providers: [${CLASS_NAME}Service, BaseChainService, TokensService],
  exports: [${CLASS_NAME}Service],
})
export class ${CLASS_NAME}Module {}
EOF

# Update protocols.module.ts to include the new protocol
PROTOCOLS_MODULE="${API_DIR}/src/protocols/protocols.module.ts"

if [ ! -f "$PROTOCOLS_MODULE" ]; then
  echo "Error: protocols.module.ts not found at ${PROTOCOLS_MODULE}"
  exit 1
fi

# Ensure import is only added once
if ! grep -q "import { ${CLASS_NAME}Service }" "$PROTOCOLS_MODULE"; then
  sed -i "/import { ProtocolsController }/i import { ${CLASS_NAME}Service } from './${PROTOCOL_NAME}/${PROTOCOL_NAME}.service';" "$PROTOCOLS_MODULE"
fi

# Ensure service is added to providers array only once
if ! grep -q "${CLASS_NAME}Service," "$PROTOCOLS_MODULE"; then
  sed -i "/providers: \[/a \    ${CLASS_NAME}Service," "$PROTOCOLS_MODULE"
fi

# Ensure service is added to constructor only once
if ! grep -q "private readonly ${PROTOCOL_NAME}Service: ${CLASS_NAME}Service" "$PROTOCOLS_MODULE"; then
  sed -i "/constructor(/a \    private readonly ${PROTOCOL_NAME}Service: ${CLASS_NAME}Service," "$PROTOCOLS_MODULE"
fi

# Ensure ProtocolRegistryService.registerService is added only once
if ! grep -q "ProtocolRegistryService.registerService(${PROTOCOL_NAME}Service);" "$PROTOCOLS_MODULE"; then
  awk -v new_line="    ProtocolRegistryService.registerService(${PROTOCOL_NAME}Service);" '
    !seen[$0]++ {print}
    /ProtocolRegistryService.registerService/ && !inserted {
      print new_line
      inserted=1
    }
  ' "$PROTOCOLS_MODULE" >"${PROTOCOLS_MODULE}.tmp" && mv "${PROTOCOLS_MODULE}.tmp" "$PROTOCOLS_MODULE"
fi

# Remove any accidental duplicates
awk '!seen[$0]++' "$PROTOCOLS_MODULE" >"${PROTOCOLS_MODULE}.tmp" && mv "${PROTOCOLS_MODULE}.tmp" "$PROTOCOLS_MODULE"

# Ensure final closing } exists and is correctly placed
if ! tail -n 1 "$PROTOCOLS_MODULE" | grep -q "}"; then
  echo "}" >>"$PROTOCOLS_MODULE"
fi

# Ensure the file ends with a newline
sed -i -e '$a\' "$PROTOCOLS_MODULE"

echo "Protocol ${PROTOCOL_NAME} has been created successfully!"
echo "Please implement the required methods in ${API_DIR}/src/protocols/${PROTOCOL_NAME}/${PROTOCOL_NAME}.service.ts"
