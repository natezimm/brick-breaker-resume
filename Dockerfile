FROM node:26-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# A pinned release rather than a moving tag, so a rebuild serves what was tested.
FROM nginx:1.31-alpine
# The headers a meta tag can't set: no framing by other sites, and no MIME sniffing.
RUN echo "server { listen 80; add_header Content-Security-Policy \"frame-ancestors 'none'\" always; add_header X-Frame-Options DENY always; add_header X-Content-Type-Options nosniff always; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
