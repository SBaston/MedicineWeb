# ═══════════════════════════════════════════════════════════════
# ETAPA 1: BUILD
# ═══════════════════════════════════════════════════════════════
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY *.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o /app/publish

# ═══════════════════════════════════════════════════════════════
# ETAPA 2: RUNTIME
# ═══════════════════════════════════════════════════════════════
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

# ═══════════════════════════════════════════════════════════════
# INSTALAR DEPENDENCIAS BASE
# ═══════════════════════════════════════════════════════════════
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    autoconf \
    automake \
    libtool \
    pkg-config \
    libpng-dev \
    libjpeg-dev \
    libtiff-dev \
    zlib1g-dev \
    libgdiplus \
    libc6 \
    wget \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    ldconfig

# ═══════════════════════════════════════════════════════════════
# DESCARGAR Y COMPILAR LEPTONICA 1.82.0 DESDE GITHUB
# ═══════════════════════════════════════════════════════════════
RUN echo "=== Descargando Leptonica 1.82.0 desde GitHub ===" && \
    cd /tmp && \
    wget https://github.com/DanBloomberg/leptonica/releases/download/1.82.0/leptonica-1.82.0.tar.gz && \
    echo "=== Descomprimiendo ===" && \
    tar -xzf leptonica-1.82.0.tar.gz && \
    cd leptonica-1.82.0 && \
    echo "=== Configurando ===" && \
    ./configure --prefix=/usr/local && \
    echo "=== Compilando ===" && \
    make -j$(nproc) && \
    echo "=== Instalando ===" && \
    make install && \
    echo "=== Actualizando ldconfig ===" && \
    ldconfig && \
    echo "✅ Leptonica 1.82.0 compilado e instalado" && \
    cd /tmp && \
    rm -rf leptonica-1.82.0*

# ═══════════════════════════════════════════════════════════════
# INSTALAR TESSERACT DESDE REPOSITORIO (usa la Leptonica compilada)
# ═══════════════════════════════════════════════════════════════
RUN echo "=== Instalando Tesseract ===" && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr && \
    rm -rf /var/lib/apt/lists/* && \
    echo "✅ Tesseract instalado"

# ═══════════════════════════════════════════════════════════════
# CREAR DIRECTORIOS
# ═══════════════════════════════════════════════════════════════
RUN mkdir -p /app/x64 && \
    mkdir -p /app/runtimes/linux-x64/native && \
    mkdir -p /app/tessdata && \
    mkdir -p /app/wwwroot/uploads/doctors/documents && \
    mkdir -p /app/wwwroot/uploads/doctors/profiles && \
    mkdir -p /app/wwwroot/uploads/courses/covers

# ═══════════════════════════════════════════════════════════════
# COPIAR LIBRERÍAS COMPILADAS A DONDE LAS BUSCA EL NUGET
# ═══════════════════════════════════════════════════════════════
RUN echo "=== Verificando archivos en /usr/local/lib/ ===" && \
    ls -lah /usr/local/lib/liblept* && \
    echo "" && \
    echo "=== Buscando archivo real .so ===" && \
    find /usr/local/lib -name "liblept*.so*" -type f && \
    echo "" && \
    echo "=== Buscando libdl.so ===" && \
    find /lib -name "libdl.so*" && \
    find /usr/lib -name "libdl.so*" && \
    echo "" && \
    echo "=== Copiando libdl.so ===" && \
    mkdir -p /usr/share/dotnet/shared/Microsoft.NETCore.App/10.0.5 && \
    cp /lib/x86_64-linux-gnu/libdl.so.2 /usr/share/dotnet/shared/Microsoft.NETCore.App/10.0.5/libdl.so && \
    cp /lib/x86_64-linux-gnu/libdl.so.2 /app/libdl.so && \
    cp /lib/x86_64-linux-gnu/libdl.so.2 /app/x64/libdl.so && \
    cp /lib/x86_64-linux-gnu/libdl.so.2 /app/runtimes/linux-x64/native/libdl.so && \
    echo "" && \
    echo "=== Copiando a /app/x64/ ===" && \
    cp -L /usr/local/lib/libleptonica.so /app/x64/libleptonica-1.82.0.so && \
    cp /usr/lib/x86_64-linux-gnu/libtesseract.so.5 /app/x64/libtesseract50.so && \
    cp /usr/lib/x86_64-linux-gnu/libpng16.so.* /app/x64/ && \
    cp /usr/lib/x86_64-linux-gnu/libjpeg.so.* /app/x64/ && \
    cp /usr/lib/x86_64-linux-gnu/libtiff.so.* /app/x64/ && \
    cp /usr/lib/x86_64-linux-gnu/libwebp.so.* /app/x64/ && \
    cp /usr/lib/x86_64-linux-gnu/libz.so.* /app/x64/ && \
    cp /usr/lib/x86_64-linux-gnu/libgif.so.* /app/x64/ && \
    echo "" && \
    echo "=== Copiando a /app/runtimes/linux-x64/native/ ===" && \
    cp -L /usr/local/lib/libleptonica.so /app/runtimes/linux-x64/native/libleptonica-1.82.0.so && \
    cp /usr/lib/x86_64-linux-gnu/libtesseract.so.5 /app/runtimes/linux-x64/native/libtesseract50.so && \
    cp /usr/lib/x86_64-linux-gnu/libpng16.so.* /app/runtimes/linux-x64/native/ && \
    cp /usr/lib/x86_64-linux-gnu/libjpeg.so.* /app/runtimes/linux-x64/native/ && \
    cp /usr/lib/x86_64-linux-gnu/libtiff.so.* /app/runtimes/linux-x64/native/ && \
    cp /usr/lib/x86_64-linux-gnu/libwebp.so.* /app/runtimes/linux-x64/native/ && \
    cp /usr/lib/x86_64-linux-gnu/libz.so.* /app/runtimes/linux-x64/native/ && \
    cp /usr/lib/x86_64-linux-gnu/libgif.so.* /app/runtimes/linux-x64/native/ && \
    echo "✅ Librerías copiadas"

# ═══════════════════════════════════════════════════════════════
# COPIAR ARCHIVOS COMPILADOS DE LA APP
# ═══════════════════════════════════════════════════════════════
COPY --from=build /app/publish .

# ═══════════════════════════════════════════════════════════════
# DESCARGAR MODELOS DE IDIOMAS
# ═══════════════════════════════════════════════════════════════
RUN wget -q https://github.com/tesseract-ocr/tessdata_best/raw/main/spa.traineddata -O /app/tessdata/spa.traineddata && \
    wget -q https://github.com/tesseract-ocr/tessdata_best/raw/main/eng.traineddata -O /app/tessdata/eng.traineddata

# ═══════════════════════════════════════════════════════════════
# VERIFICAR INSTALACIÓN
# ═══════════════════════════════════════════════════════════════
RUN echo "=== Verificando /app/x64/ ===" && \
    ls -lah /app/x64/ && \
    echo "" && \
    echo "=== Verificando libleptonica-1.82.0.so ===" && \
    file /app/x64/libleptonica-1.82.0.so && \
    echo "" && \
    echo "=== Verificando libtesseract50.so ===" && \
    file /app/x64/libtesseract50.so && \
    echo "" && \
    echo "=== Tesseract version ===" && \
    tesseract --version || true

# ═══════════════════════════════════════════════════════════════
# VARIABLES DE ENTORNO
# ═══════════════════════════════════════════════════════════════
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV TESSDATA_PREFIX=/app/tessdata
ENV LD_LIBRARY_PATH=/app/x64:/app/runtimes/linux-x64/native:/usr/local/lib:/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

EXPOSE 5000

ENTRYPOINT ["dotnet", "MedicineBackend.dll"]