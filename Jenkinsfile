pipeline {
    agent any
    tools {
        nodejs 'NodeJS-20'
    }
    stages {
        stage('Checkout') {
            steps {
                echo '📥 Pulling latest code...'
                checkout scm
            }
        }
        stage('Install Backend Dependencies') {
            steps {
                echo '📦 Installing backend dependencies...'
                dir('backend') {
                    bat 'npm install'
                }
            }
        }
        stage('Install Frontend Dependencies') {
            steps {
                echo '📦 Installing frontend dependencies...'
                dir('frontend') {
                    bat 'npm install'
                }
            }
        }
        stage('Run Frontend Tests') {
            steps {
                echo '🧪 Running frontend tests...'
                dir('frontend') {
                    bat 'set CI=true && npm test -- --watchAll=false --passWithNoTests'
                }
            }
        }
        stage('Deploy') {
            steps {
                echo '🚀 Stopping any existing processes...'
                bat 'taskkill /F /IM node.exe /T & exit 0'

                echo '🚀 Writing environment config...'
                dir('backend') {
                    bat '''
                        echo NEO4J_URI=bolt://localhost:7687> .env
                        echo NEO4J_USER=neo4j>> .env
                        echo NEO4J_PASSWORD=password123>> .env
                        echo PORT=5001>> .env
                    '''
                }

                echo '🚀 Writing startup batch file...'
                bat '''
                    echo @echo off > C:\\Users\\Prajwal\\Desktop\\start-app.bat
                    echo start "Backend" /D "C:\\ProgramData\\Jenkins\\.jenkins\\workspace\\Social-Network-Pipeline\\backend" "C:\\Program Files\\nodejs\\node.exe" server.js >> C:\\Users\\Prajwal\\Desktop\\start-app.bat
                    echo set CI= >> C:\\Users\\Prajwal\\Desktop\\start-app.bat
                    echo start "Frontend" /D "C:\\ProgramData\\Jenkins\\.jenkins\\workspace\\Social-Network-Pipeline\\frontend" cmd /k ""C:\\Program Files\\nodejs\\npm.cmd" start" >> C:\\Users\\Prajwal\\Desktop\\start-app.bat
                '''

                echo '🚀 Launching app...'
                bat 'powershell -Command "Start-Process -FilePath \'C:\\Users\\Prajwal\\Desktop\\start-app.bat\' -WindowStyle Normal"'

                echo '✅ Backend running at http://localhost:5001'
                echo '✅ Frontend running at http://localhost:3000'
            }
        }
    }
    post {
        success {
            echo '🎉 Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed. Check the logs above.'
        }
    }
}