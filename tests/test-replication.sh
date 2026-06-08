#!/bin/bash
# =============================================================================
#  tests/test-replication.sh
#  Parla P4 — REL-01: Replication Pattern
#
#  Demonstrates hot standby replication using MongoDB Atlas replica set.
#  A 3-node replica set (1 primary + 2 secondaries) ensures that data written
#  to the primary is automatically propagated to all secondaries with
#  sub-second lag, enabling automatic failover with no manual intervention.
#
#  usage: ./tests/test-replication.sh
# =============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'




MONGO_URI="${MONGO_URI:?ERROR: MONGO_URI is not set. Run: source .env.test}"
MONGO_URI_SECONDARY="${MONGO_URI_SECONDARY:?ERROR: MONGO_URI_SECONDARY is not set. Run: source .env.test}"
MONGO_DB="${MONGO_DB:?ERROR: MONGO_DB is not set. Run: source .env.test}"
NS="parla"
TEST_ID="repl_test_$(date +%s)"

echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          REPLICATION PATTERN             ║"
echo "║                                                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Spinning up a temporary mongosh pod inside the K8s cluster...${NC}\n"

kubectl run -n "$NS" mongo-test --rm -i --restart=Never \
  --image=mongo:7 \
  --env="MONGO_URI=$MONGO_URI" \
  --env="MONGO_URI_SEC=$MONGO_URI_SECONDARY" \
  --env="MONGO_DB=$MONGO_DB" \
  --env="TEST_ID=$TEST_ID" \
  -- bash << 'SCRIPT'

echo "--- Step 1: Replica Set Topology ---"





echo "qqqquerying Atlas for the current replica set status..."
mongosh "$MONGO_URI" --quiet --eval "
  const status = rs.status();
  print('Replica set name: ' + status.set);
  print('Members:');
  status.members.forEach(m => {
    const role = m.stateStr === 'PRIMARY' ? '  [PRIMARY]  ' : '  [SECONDARY]';
    print(role + ' ' + m.name + '  (health: ' + (m.health === 1 ? 'ok' : 'down') + ')');
  });
"

echo ""
echo "--- Step 2: Write to PRIMARY ---"



echo "Inserting test document into the primary node..."
mongosh "$MONGO_URI" --quiet --eval "
  use('$MONGO_DB');
  db.replication_test.insertOne({ _id: '$TEST_ID', value: 42, ts: new Date() });
  print('Document inserted on primary  --->  _id: $TEST_ID');
"

echo ""
echo "--- Step 3: Read from SECONDARY ---"

echo "waaaaaaaaaaiting 2s for replication lag, then reading from a secondary node..."
sleep 2
mongosh "$MONGO_URI_SEC" --quiet --eval "
  use('$MONGO_DB');
  const doc = db.replication_test.findOne({ _id: '$TEST_ID' });
  if (doc) {
    print('Document found on secondary:');
    print('  ' + JSON.stringify(doc));
    print('');
    print('REPLICATION CONFIRMED — hot standby is working.');
  } else {
    print('ERROR: document not found on secondary node.');
    process.exit(1);
  }
  db.replication_test.deleteOne({ _id: '$TEST_ID' });
  print('Test document cleaned up.');
"
SCRIPT