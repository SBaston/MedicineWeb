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
# INSTALAR TESSERACT OCR
# ═══════════════════════════════════════════════════════════════
RUN apt-get update && \
    apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-spa \
    tesseract-ocr-eng \
    libtesseract-dev \
    libleptonica-dev \
    wget && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/tessdata

RUN wget -q https://github.com/tesseract-ocr/tessdata_best/raw/main/spa.traineddata -O /app/tessdata/spa.traineddata && \
    wget -q https://github.com/tesseract-ocr/tessdata_best/raw/main/eng.traineddata -O /app/tessdata/eng.traineddata

RUN mkdir -p /app/uploads

COPY --from=build /app/publish .

EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV TESSDATA_PREFIX=/app/tessdata

ENTRYPOINT ["dotnet", "MedicineBackend.dll"]