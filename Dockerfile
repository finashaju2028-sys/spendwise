# Production stage using official lightweight Nginx on Alpine Linux
FROM nginx:alpine

# Project metadata
LABEL maintainer="SpendWise Project"
LABEL description="SpendWise - Personal Expense Tracker static web application"

# Remove default static files from Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx virtual host configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website assets to Nginx web root directory
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY vendor/ /usr/share/nginx/html/vendor/

# Expose container HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
