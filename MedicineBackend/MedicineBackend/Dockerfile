# ═══════════════════════════════════════════════════════════════
# ETAPA 1: BUILD
# ═══════════════════════════════════════════════════════════════
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copiar archivos de proyecto y restaurar dependencias
COPY *.csproj ./
RUN dotnet restore

# Copiar todo el código y compilar
COPY . ./
RUN dotnet publish -c Release -o /app/publish

# ═══════════════════════════════════════════════════════════════
# ETAPA 2: RUNTIME
# ═══════════════════════════════════════════════════════════════
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

# ═══════════════════════════════════════════════════════════════
# INSTALAR TESSERACT OCR Y DEPENDENCIAS
# ═══════════════════════════════════════════════════════════════
RUN apt-get update && apt-get install -y tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng libtesseract-dev libleptonica-dev wget && rm -rf /var/lib/apt/lists/*

# Crear directorio para datos de Tesseract
RUN mkdir -p /app/tessdata

# Descargar datos de entrenamiento de alta calidad (tessdata_best)
RUN wget -q https://github.com/tesseract-ocr/tessdata_best/raw/main/spa.traineddata -O /app/tessdata/spa.traineddata && wget -q https://github.com/tesseract-ocr/tessdata_best/raw/main/eng.traineddata -O /app/tessdata/eng.traineddata

# Crear directorios necesarios
RUN mkdir -p /app/uploads && mkdir -p /https

# Copiar los archivos compilados
COPY --from=build /app/publish .

# Exponer puertos HTTP y HTTPS
EXPOSE 80
EXPOSE 443

# Variables de entorno por defecto
ENV ASPNETCORE_URLS=https://+:443;http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production
ENV TESSDATA_PREFIX=/app/tessdata

# Ejecutar la aplicación
ENTRYPOINT ["dotnet", "MedicineBackend.dll"]