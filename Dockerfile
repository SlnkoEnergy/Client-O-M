# Stage 1: Build the frontend
FROM node:20-alpine AS build

RUN apk add --no-cache libc6-compat

WORKDIR /Client-O-M

COPY .env .env
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Fix esbuild binary for Alpine
RUN npm uninstall esbuild && npm install esbuild@0.19.9

# Copy the rest of the project files
COPY . .

# Build the project
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

# Copy built files to NGINX directory
COPY --from=build /Client-O-M/dist /usr/share/nginx/html


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]