pipeline {
    // The Jenkins controller image (infra/jenkins/Dockerfile) ships Node 20,
    // npm, curl and jq, so every stage runs directly on the built-in agent
    // with plain `sh` steps — no NodeJS tool plugin, no Docker-in-Docker.
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
    }

    parameters {
        booleanParam(
            name: 'RUN_DEPLOY',
            defaultValue: true,
            description: 'Trigger the Render + Vercel deploy hooks and run the Monitor health gate.'
        )
        booleanParam(
            name: 'RUN_SEED',
            defaultValue: false,
            description: 'Re-seed the Neo4j demo graph before monitoring (idempotent).'
        )
    }

    environment {
        // Live backend health endpoint — polled by the Monitor stage.
        HEALTH_URL = 'https://iris-social-networking-website.onrender.com/api/health'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Pulling latest code...'
                checkout scm
            }
        }

        stage('Install') {
            parallel {
                stage('Backend deps') {
                    steps {
                        dir('backend') { sh 'npm ci' }
                    }
                }
                stage('Frontend deps') {
                    steps {
                        dir('frontend') { sh 'npm ci' }
                    }
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Backend tests') {
                    steps {
                        // Tests mock Firebase + Neo4j, so no secrets are needed.
                        dir('backend') { sh 'npm test' }
                    }
                }
                stage('Frontend tests') {
                    steps {
                        dir('frontend') { sh 'npm test' }
                    }
                }
            }
        }

        stage('Build frontend') {
            steps {
                // The bundle only needs the public Firebase web identifiers;
                // CI uses dummy VITE_* fallbacks, so the build succeeds without
                // secrets. Wire real values as Jenkins credentials for a fully
                // configured production bundle if desired.
                dir('frontend') { sh 'npm run build' }
            }
        }

        stage('Deploy') {
            when { expression { return params.RUN_DEPLOY } }
            steps {
                // Deploy Hook URLs are stored as Jenkins "Secret text" creds so
                // they never touch source control. Each POST tells the platform
                // to pull `main` and rebuild.
                withCredentials([
                    string(credentialsId: 'render-deploy-hook', variable: 'RENDER_HOOK'),
                    string(credentialsId: 'vercel-deploy-hook', variable: 'VERCEL_HOOK')
                ]) {
                    echo 'Triggering Render (backend) deploy hook...'
                    sh 'curl -fsS -X POST "$RENDER_HOOK" > /dev/null && echo "  -> Render deploy queued."'
                    echo 'Triggering Vercel (frontend) deploy hook...'
                    sh 'curl -fsS -X POST "$VERCEL_HOOK" > /dev/null && echo "  -> Vercel deploy queued."'
                }
            }
        }

        stage('Seed') {
            when { expression { return params.RUN_SEED } }
            steps {
                // Optional: rebuild the demo graph. Idempotent (MERGE-based).
                withCredentials([
                    string(credentialsId: 'neo4j-uri', variable: 'NEO4J_URI'),
                    string(credentialsId: 'neo4j-user', variable: 'NEO4J_USER'),
                    string(credentialsId: 'neo4j-password', variable: 'NEO4J_PASSWORD'),
                    string(credentialsId: 'neo4j-database', variable: 'NEO4J_DATABASE')
                ]) {
                    dir('backend') { sh 'node scripts/seed.js' }
                }
            }
        }

        stage('Monitor') {
            when { expression { return params.RUN_DEPLOY } }
            steps {
                // Health gate: Render's free tier rebuilds + cold-starts, so we
                // poll /api/health until the backend reports a live DB
                // connection ("db":true). Fails the build if it never recovers.
                sh '''
                    set -e
                    echo "Polling $HEALTH_URL until db:true (up to ~6 min)..."
                    attempts=36
                    delay=10
                    for i in $(seq 1 $attempts); do
                        body=$(curl -fsS --max-time 20 "$HEALTH_URL" 2>/dev/null || echo "")
                        echo "  attempt $i/$attempts -> ${body:-<no response>}"
                        if echo "$body" | jq -e '.ok == true and .db == true' > /dev/null 2>&1; then
                            echo "Backend healthy: DB connection confirmed."
                            exit 0
                        fi
                        sleep $delay
                    done
                    echo "Backend did not report db:true within the timeout."
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully.'
            archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: true
        }
        failure {
            echo 'Pipeline failed. Check the stage logs above.'
        }
    }
}
