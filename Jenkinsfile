pipeline {
    // The Jenkins controller image (infra/jenkins/Dockerfile) ships Node 20,
    // npm, curl, jq and the Docker CLI. Build+Test run on the built-in agent;
    // Deploy drives the app stack via the host Docker socket. Each stage tees
    // its output + a PASS marker into the shared /evidence volume, which the
    // standalone dashboard (http://localhost:4000) renders per build.
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
    }

    parameters {
        booleanParam(
            name: 'RUN_DEPLOY',
            defaultValue: true,
            description: 'Deploy the local Docker app stack and run the Monitor health gate.'
        )
        booleanParam(
            name: 'RUN_SEED',
            defaultValue: false,
            description: 'Seed the local Neo4j demo graph after deploy (idempotent).'
        )
    }

    environment {
        APP_COMPOSE = 'infra/app/docker-compose.yml'
        HEALTH_URL  = 'http://host.docker.internal:5001/api/health'
        // Per-build evidence dir on the shared volume (read by the dashboard).
        EVID = "/evidence/build-${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Pulling latest code...'
                checkout scm
                sh 'mkdir -p "$EVID"'
            }
        }

        stage('Install') {
            parallel {
                stage('Backend deps') {
                    steps {
                        dir('backend') {
                            sh '''#!/bin/bash
set -o pipefail
npm ci 2>&1 | tee "$EVID/install-backend.log"
echo PASS > "$EVID/install-backend.status"
'''
                        }
                    }
                }
                stage('Frontend deps') {
                    steps {
                        dir('frontend') {
                            sh '''#!/bin/bash
set -o pipefail
npm ci 2>&1 | tee "$EVID/install-frontend.log"
echo PASS > "$EVID/install-frontend.status"
'''
                        }
                    }
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Backend tests') {
                    steps {
                        dir('backend') {
                            sh '''#!/bin/bash
set -o pipefail
npm test 2>&1 | tee "$EVID/test-backend.log"
echo PASS > "$EVID/test-backend.status"
'''
                        }
                    }
                }
                stage('Frontend tests') {
                    steps {
                        dir('frontend') {
                            sh '''#!/bin/bash
set -o pipefail
npm test 2>&1 | tee "$EVID/test-frontend.log"
echo PASS > "$EVID/test-frontend.status"
'''
                        }
                    }
                }
            }
        }

        stage('Build frontend') {
            steps {
                dir('frontend') {
                    sh '''#!/bin/bash
set -o pipefail
npm run build 2>&1 | tee "$EVID/build.log"
echo PASS > "$EVID/build.status"
'''
                }
            }
        }

        stage('Deploy') {
            when { expression { return params.RUN_DEPLOY } }
            steps {
                sh '''#!/bin/bash
set -o pipefail
{
  echo "Deploying local app stack (Neo4j + backend + frontend)..."
  docker compose -f "$APP_COMPOSE" up -d --build
  docker compose -f "$APP_COMPOSE" ps
} 2>&1 | tee "$EVID/deploy.log"
rc=${PIPESTATUS[0]}
[ $rc -eq 0 ] && echo PASS > "$EVID/deploy.status"
exit $rc
'''
            }
        }

        stage('Seed') {
            when { expression { return params.RUN_SEED } }
            steps {
                sh '''#!/bin/bash
set -o pipefail
docker compose -f "$APP_COMPOSE" exec -T backend node scripts/seed.js 2>&1 | tee "$EVID/seed.log"
echo PASS > "$EVID/seed.status"
'''
            }
        }

        stage('Monitor') {
            when { expression { return params.RUN_DEPLOY } }
            steps {
                sh '''#!/bin/bash
set -o pipefail
{
  echo "Polling $HEALTH_URL until db:true (up to ~3 min)..."
  attempts=36; delay=5; ok=1
  for i in $(seq 1 $attempts); do
    body=$(curl -fsS --max-time 10 "$HEALTH_URL" 2>/dev/null || echo "")
    echo "  attempt $i/$attempts -> ${body:-<no response>}"
    printf '%s' "$body" > "$EVID/health.txt"
    if echo "$body" | jq -e '.ok == true and .db == true' >/dev/null 2>&1; then
      echo "Backend healthy: DB connection confirmed. App live at http://localhost:8081"
      ok=0; break
    fi
    sleep $delay
  done
  if [ $ok -ne 0 ]; then
    echo "Backend did not report db:true within the timeout."
    docker compose -f "$APP_COMPOSE" logs --tail=40 backend || true
  fi
  exit $ok
} 2>&1 | tee "$EVID/monitor.log"
rc=${PIPESTATUS[0]}
[ $rc -eq 0 ] && echo PASS > "$EVID/monitor.status"
exit $rc
'''
            }
        }
    }

    post {
        always {
            // Build the manifest.json the evidence dashboard renders, then also
            // archive the raw evidence as downloadable Jenkins artifacts.
            script {
                def res = currentBuild.currentResult
                def started = currentBuild.startTimeInMillis
                sh """#!/bin/bash
mkdir -p "\$EVID"
if [ -f infra/evidence/manifest.js ]; then
  node infra/evidence/manifest.js "\$EVID" "\$BUILD_NUMBER" "${res}" "${env.GIT_BRANCH ?: ''}" "${env.GIT_COMMIT ?: ''}" "${started}"
fi
rm -rf evidence-out && mkdir -p evidence-out && cp -r "\$EVID/." evidence-out/ 2>/dev/null || true
"""
            }
            archiveArtifacts artifacts: 'evidence-out/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: true
        }
        success {
            echo 'Pipeline completed successfully. App at http://localhost:8081 · evidence at http://localhost:4000'
        }
        failure {
            echo 'Pipeline failed. See the evidence dashboard at http://localhost:4000'
        }
    }
}
