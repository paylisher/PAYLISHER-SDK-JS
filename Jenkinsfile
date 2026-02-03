// Paylisher Web SDK - Jenkins Pipeline
// Multi-environment Docker build and deployment

pipeline {
    agent any

    // Environment variables (Jenkins credentials'dan alınır)
    environment {
        DOCKER_REGISTRY = 'registry.paylisher.com'
        DOCKER_IMAGE = 'paylisher/web-sdk'

        // Git info
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        BUILD_DATE = sh(script: "date -u +'%Y-%m-%dT%H:%M:%SZ'", returnStdout: true).trim()

        // Docker credentials
        DOCKER_CREDS = credentials('docker-registry-credentials')
    }

    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['development', 'test', 'production', 'on-premise'],
            description: 'Deployment environment'
        )
        string(
            name: 'VERSION',
            defaultValue: '1.1.0',
            description: 'SDK version (e.g., 1.1.0)'
        )
        string(
            name: 'CUSTOMER_NAME',
            defaultValue: '',
            description: 'Customer name (for on-premise builds only)'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "🔄 Checking out code..."
                    checkout scm
                }
            }
        }

        stage('Set Environment Variables') {
            steps {
                script {
                    echo "⚙️ Setting environment variables for: ${params.ENVIRONMENT}"

                    // Environment-specific variables
                    if (params.ENVIRONMENT == 'development') {
                        env.DATA_STUDIO_HOST = 'http://localhost:8000'
                        env.CAMPAIGN_HOST = 'http://localhost:4040'
                        env.API_KEY = credentials('dev-api-key')
                        env.DEBUG = 'true'
                        env.IMAGE_TAG = "${params.VERSION}-dev"
                    }
                    else if (params.ENVIRONMENT == 'test') {
                        env.DATA_STUDIO_HOST = credentials('test-data-studio-host')
                        env.CAMPAIGN_HOST = credentials('test-campaign-host')
                        env.API_KEY = credentials('test-api-key')
                        env.DEBUG = 'true'
                        env.IMAGE_TAG = "${params.VERSION}-test"
                    }
                    else if (params.ENVIRONMENT == 'production') {
                        env.DATA_STUDIO_HOST = credentials('prod-data-studio-host')
                        env.CAMPAIGN_HOST = credentials('prod-campaign-host')
                        env.API_KEY = credentials('prod-api-key')
                        env.DEBUG = 'false'
                        env.IMAGE_TAG = "${params.VERSION}"
                    }
                    else if (params.ENVIRONMENT == 'on-premise') {
                        // On-premise customer specific
                        if (params.CUSTOMER_NAME == '') {
                            error "CUSTOMER_NAME is required for on-premise builds"
                        }

                        env.DATA_STUDIO_HOST = credentials("${params.CUSTOMER_NAME}-data-studio-host")
                        env.CAMPAIGN_HOST = credentials("${params.CUSTOMER_NAME}-campaign-host")
                        env.API_KEY = credentials("${params.CUSTOMER_NAME}-api-key")
                        env.DEBUG = 'false'
                        env.IMAGE_TAG = "${params.VERSION}-${params.CUSTOMER_NAME}"
                    }

                    echo "✅ Environment variables set:"
                    echo "   DATA_STUDIO_HOST: ${env.DATA_STUDIO_HOST}"
                    echo "   CAMPAIGN_HOST: ${env.CAMPAIGN_HOST}"
                    echo "   DEBUG: ${env.DEBUG}"
                    echo "   IMAGE_TAG: ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    echo "🐳 Building Docker image..."

                    sh """
                        docker build \
                            --build-arg DATA_STUDIO_HOST=${env.DATA_STUDIO_HOST} \
                            --build-arg CAMPAIGN_HOST=${env.CAMPAIGN_HOST} \
                            --build-arg API_KEY=${env.API_KEY} \
                            --build-arg DEBUG=${env.DEBUG} \
                            --build-arg VERSION=${params.VERSION} \
                            --build-arg BUILD_DATE=${env.BUILD_DATE} \
                            --build-arg VCS_REF=${env.GIT_COMMIT_SHORT} \
                            -f Dockerfile.improved \
                            -t ${env.DOCKER_IMAGE}:${env.IMAGE_TAG} \
                            -t ${env.DOCKER_IMAGE}:latest \
                            .
                    """

                    echo "✅ Docker image built: ${env.DOCKER_IMAGE}:${env.IMAGE_TAG}"
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    echo "🧪 Running tests..."

                    // Start container
                    sh """
                        docker run -d \
                            --name paylisher-sdk-test-${BUILD_NUMBER} \
                            -p 8080:8080 \
                            ${env.DOCKER_IMAGE}:${env.IMAGE_TAG}
                    """

                    // Wait for health check
                    sleep(time: 30, unit: 'SECONDS')

                    // Test 1: Health check
                    sh """
                        curl -f http://localhost:8080/health || exit 1
                    """
                    echo "✅ Health check passed"

                    // Test 2: SDK file accessible
                    sh """
                        curl -f http://localhost:8080/paylisher.min.js -o /dev/null || exit 1
                    """
                    echo "✅ SDK file accessible"

                    // Test 3: CORS headers
                    sh """
                        curl -s -I http://localhost:8080/paylisher.min.js | grep -q 'Access-Control-Allow-Origin: \\*' || exit 1
                    """
                    echo "✅ CORS headers present"

                    // Test 4: Gzip compression
                    sh """
                        SIZE_GZIP=\$(curl -s -H 'Accept-Encoding: gzip' http://localhost:8080/paylisher.min.js --compressed | wc -c)
                        if [ \$SIZE_GZIP -lt 10000 ]; then
                            echo "✅ Gzip compression working (size: \$SIZE_GZIP bytes)"
                        else
                            echo "❌ Gzip compression not working"
                            exit 1
                        fi
                    """

                    // Cleanup
                    sh """
                        docker stop paylisher-sdk-test-${BUILD_NUMBER}
                        docker rm paylisher-sdk-test-${BUILD_NUMBER}
                    """

                    echo "✅ All tests passed"
                }
            }
        }

        stage('Push to Registry') {
            when {
                expression { params.ENVIRONMENT != 'development' }
            }
            steps {
                script {
                    echo "📤 Pushing to Docker registry..."

                    sh """
                        echo ${DOCKER_CREDS_PSW} | docker login ${env.DOCKER_REGISTRY} -u ${DOCKER_CREDS_USR} --password-stdin

                        docker tag ${env.DOCKER_IMAGE}:${env.IMAGE_TAG} ${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE}:${env.IMAGE_TAG}
                        docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE}:${env.IMAGE_TAG}

                        # Push latest tag for production
                        if [ "${params.ENVIRONMENT}" = "production" ]; then
                            docker tag ${env.DOCKER_IMAGE}:${env.IMAGE_TAG} ${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE}:latest
                            docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE}:latest
                        fi
                    """

                    echo "✅ Image pushed to registry"
                }
            }
        }

        stage('Deploy') {
            when {
                expression { params.ENVIRONMENT != 'on-premise' }
            }
            steps {
                script {
                    echo "🚀 Deploying to ${params.ENVIRONMENT}..."

                    if (params.ENVIRONMENT == 'production') {
                        // Production deployment (Kubernetes)
                        sh """
                            kubectl set image deployment/paylisher-web-sdk \
                                web-sdk=${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE}:${env.IMAGE_TAG} \
                                -n paylisher-prod

                            kubectl rollout status deployment/paylisher-web-sdk -n paylisher-prod
                        """
                    } else if (params.ENVIRONMENT == 'test') {
                        // Test deployment (Docker Compose)
                        sh """
                            ssh devops@test-server "
                                cd /opt/paylisher-sdk &&
                                docker-compose pull sdk-test &&
                                docker-compose up -d sdk-test
                            "
                        """
                    }

                    echo "✅ Deployment successful"
                }
            }
        }

        stage('Export On-Premise Build') {
            when {
                expression { params.ENVIRONMENT == 'on-premise' }
            }
            steps {
                script {
                    echo "📦 Exporting on-premise build for ${params.CUSTOMER_NAME}..."

                    sh """
                        mkdir -p builds/${params.CUSTOMER_NAME}

                        # Export Docker image
                        docker save ${env.DOCKER_IMAGE}:${env.IMAGE_TAG} | gzip > \
                            builds/${params.CUSTOMER_NAME}/paylisher-sdk-${params.CUSTOMER_NAME}-${params.VERSION}.tar.gz

                        # Create deployment guide
                        cat > builds/${params.CUSTOMER_NAME}/README.txt << EOF
Paylisher Web SDK - ${params.CUSTOMER_NAME}
Version: ${params.VERSION}
Build Date: ${env.BUILD_DATE}
Git Commit: ${env.GIT_COMMIT_SHORT}

Deployment Instructions:
1. Load Docker image:
   docker load < paylisher-sdk-${params.CUSTOMER_NAME}-${params.VERSION}.tar.gz

2. Run container:
   docker run -d -p 8080:8080 --name paylisher-sdk \\
       --restart always \\
       ${env.DOCKER_IMAGE}:${env.IMAGE_TAG}

3. Verify:
   curl http://localhost:8080/health
   curl http://localhost:8080/paylisher.min.js

Configuration:
- DataStudio Host: ${env.DATA_STUDIO_HOST}
- Campaign Host: ${env.CAMPAIGN_HOST}
- Debug Mode: ${env.DEBUG}

Support: support@paylisher.com
EOF

                        echo "Package created: builds/${params.CUSTOMER_NAME}/paylisher-sdk-${params.CUSTOMER_NAME}-${params.VERSION}.tar.gz"
                    """

                    // Archive for download
                    archiveArtifacts artifacts: "builds/${params.CUSTOMER_NAME}/*", fingerprint: true

                    echo "✅ On-premise build exported"
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully!"
            echo "Environment: ${params.ENVIRONMENT}"
            echo "Version: ${params.VERSION}"
            echo "Image: ${env.DOCKER_IMAGE}:${env.IMAGE_TAG}"

            // Send notification (Slack, email, etc.)
            // slackSend(color: 'good', message: "✅ Paylisher SDK ${params.ENVIRONMENT} deployment successful")
        }

        failure {
            echo "❌ Pipeline failed!"

            // Send notification
            // slackSend(color: 'danger', message: "❌ Paylisher SDK ${params.ENVIRONMENT} deployment failed")
        }

        always {
            // Cleanup
            sh """
                docker system prune -f
            """
        }
    }
}
