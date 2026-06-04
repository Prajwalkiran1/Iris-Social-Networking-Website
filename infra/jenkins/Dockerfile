# Reproducible Jenkins controller for the Iris CI/CD pipeline.
# Bakes Node 20 + npm, curl, and jq into the official Jenkins LTS image so the
# pipeline runs every stage on the built-in agent with plain `sh` steps —
# no NodeJS tool plugin to configure by hand, no Docker-in-Docker.
FROM jenkins/jenkins:lts

# Root for OS-level installs; we drop back to the jenkins user at the end.
USER root

# Node 20 (NodeSource) + jq for parsing the /api/health JSON in the Monitor
# stage. curl ships in the base image but is pinned here for clarity.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl jq ca-certificates gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
       | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
       > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && node --version && npm --version \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Pre-install the plugins the Jenkinsfile relies on so the controller is usable
# on first boot (pipeline DSL, git checkout, credentials bindings).
RUN jenkins-plugin-cli --plugins \
    workflow-aggregator \
    git \
    credentials-binding \
    timestamper

USER jenkins
