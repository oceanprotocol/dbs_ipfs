FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json ./

# If you are building your code for production
RUN npm ci
# RUN npm ci --only=production

# Bundle app source
COPY . ./
ENV PORT=8081
ENV PRIVATE_KEY="0000000000000000000000000000000000000000000000000000000000000000"
ENV SQLITE_DB_PATH=/usr/src/app/db.sqlite3
ENV REGISTRATION_INTERVAL=30000
ENV DBS_URI="http://localhost"
ENV SELF_URI="https://localhost"
ENV IPFS_GATEWAY="https://cloudflare-ipfs.com/ipfs/"
ENV MAX_UPLOAD_SIZE=1099511627776

EXPOSE 8081

CMD ["npm", "start"]