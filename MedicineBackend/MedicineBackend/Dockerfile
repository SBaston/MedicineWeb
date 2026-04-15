# ═══════════════════════════════════════════════════════════════
# Backend Dockerfile - .NET 10.0
# Solución completa para error de NuGet en Windows → Linux
# ═══════════════════════════════════════════════════════════════

FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS restore
WORKDIR /src

# Configurar NuGet para Linux
ENV NUGET_PACKAGES=/root/.nuget/packages
RUN dotnet nuget locals all --clear

# Copiar proyecto
COPY ["*.csproj", "./"]

# Restaurar dependencias
RUN dotnet restore --disable-parallel

# ═══════════════════════════════════════════════════════════════
FROM restore AS build
WORKDIR /src

# Copiar todo el código
COPY . .

# CRÍTICO: Eliminar obj/bin de Windows antes de compilar
RUN rm -rf obj bin

# Compilar
RUN dotnet build -c Release -o /app/build

# ═══════════════════════════════════════════════════════════════
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# ═══════════════════════════════════════════════════════════════
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app

# Instalar curl para healthcheck
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# Usuario no-root
RUN groupadd -r nexussalud && \
    useradd -r -g nexussalud nexussalud

# Crear directorios
RUN mkdir -p /app/uploads /app/logs && \
    chown -R nexussalud:nexussalud /app

# Copiar aplicación
COPY --from=publish --chown=nexussalud:nexussalud /app/publish .

# Variables de entorno
ENV ASPNETCORE_URLS=http://+:5000 \
    ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000
USER nexussalud

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["dotnet", "MedicineBackend.dll"]