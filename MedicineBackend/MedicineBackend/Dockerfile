# ═══════════════════════════════════════════════════════════════
# Backend Dockerfile - .NET 10.0
# ✅ SIN TESSERACT OCR
# ═══════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════
# ETAPA 1: BUILD
# ═══════════════════════════════════════════════════════════════
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copiar archivos de proyecto
COPY ["MedicineBackend.csproj", "./"]

# Restaurar dependencias
RUN dotnet restore "MedicineBackend.csproj"

# Copiar código fuente
COPY . .

# Compilar en modo Release
RUN dotnet build "MedicineBackend.csproj" -c Release -o /app/build

# ═══════════════════════════════════════════════════════════════
# ETAPA 2: PUBLISH
# ═══════════════════════════════════════════════════════════════
FROM build AS publish
RUN dotnet publish "MedicineBackend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ═══════════════════════════════════════════════════════════════
# ETAPA 3: RUNTIME
# ✅ SIN TESSERACT - Solo runtime básico con .NET 10
# ═══════════════════════════════════════════════════════════════
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app

# Crear directorio para uploads
RUN mkdir -p /app/uploads

# Copiar aplicación publicada
COPY --from=publish /app/publish .

# Variables de entorno por defecto
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Puerto
EXPOSE 5000

# Ejecutar aplicación
ENTRYPOINT ["dotnet", "MedicineBackend.dll"]