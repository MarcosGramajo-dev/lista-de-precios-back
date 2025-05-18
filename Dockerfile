# Usa una imagen liviana de Node
FROM node:18-alpine

# Define el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de tu backend al contenedor
COPY . .

# Instala dependencias
RUN npm install

# Expone el puerto del backend
EXPOSE 3001

# Comando para iniciar el backend
CMD ["node", "index.js"]