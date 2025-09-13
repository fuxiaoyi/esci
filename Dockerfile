# Use the official Node.js image as the base image
FROM node:19-alpine

#RUN set -eux && sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

ARG NODE_ENV

ENV NODE_ENV=$NODE_ENV

# Needed for the wait-for-db script
RUN apk add --no-cache netcat-openbsd

# Set the working directory
WORKDIR /next

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# 设置npm使用阿里云镜像源
RUN npm config set registry https://registry.npmmirror.com

# Install dependencies
RUN npm ci

# Copy the wait-for-db.sh script
COPY wait-for-db.sh /usr/local/bin/wait-for-db.sh
RUN chmod +x /usr/local/bin/wait-for-db.sh

# Copy the rest of the application code
COPY . .
COPY entrypoint.sh /

# Ensure correct line endings after these files are edited by windows
RUN apk add --no-cache dos2unix netcat-openbsd \
    && dos2unix /entrypoint.sh


# Expose the port the app will run on
EXPOSE 3000

ENTRYPOINT ["sh", "/entrypoint.sh"]

# Start the application
# CMD ["npm", "run", "dev"]


RUN npm run build
CMD ["npm", "run", "start"]