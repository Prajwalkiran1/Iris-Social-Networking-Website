# Reproducible Jenkins controller for the Iris local CI/CD demo.
# Bakes Node 20 + npm, curl, jq, and the Docker CLI (+ compose plugin) into the
# official Jenkins LTS image. Node/npm run the Build+Test stages directly on the
# built-in agent; the Docker CLI lets the Deploy stage drive the app stack via
# the host's Docker socket (mounted in docker-compose.yml).
FROM jenkins/jenkins:lts

# Root for OS-level installs; we drop back to the jenkins user at the end.
USER root

# Node 20 (NodeSource) + jq (parses /api/health JSON) + the Docker apt repo,
# then the Docker CLI and the compose v2 plugin. curl ships in the base image.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl jq ca-certificates gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
       | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
       > /etc/apt/sources.list.d/nodesource.list \
    && curl -fsSL https://download.docker.com/linux/debian/gpg \
       | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" \
       > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs docker-ce-cli docker-compose-plugin \
    && node --version && npm --version && docker --version && docker compose version \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Pre-install the plugins the Jenkinsfile relies on so the controller is usable
# on first boot (pipeline DSL, git checkout, credentials bindings).
RUN jenkins-plugin-cli --plugins \
    workflow-aggregator \
    git \
    credentials-binding \
    timestamper

USER jenkins
