pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
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
                        dir('backend') { bat 'npm ci' }
                    }
                }
                stage('Frontend deps') {
                    steps {
                        dir('frontend') { bat 'npm ci' }
                    }
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Backend tests') {
                    steps {
                        dir('backend') { bat 'npm test' }
                    }
                }
                stage('Frontend tests') {
                    steps {
                        dir('frontend') { bat 'npm test' }
                    }
                }
            }
        }

        stage('Build frontend') {
            steps {
                // Tests mock Firebase/Neo4j, so no secrets are needed in CI.
                // The bundle only needs the public Firebase web identifiers;
                // wire them as Jenkins credentials/parameters for a fully
                // configured build — otherwise the build still succeeds.
                dir('frontend') { bat 'npm run build' }
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
