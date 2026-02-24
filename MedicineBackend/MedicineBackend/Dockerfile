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

# Copiar los archivos compilados
COPY --from=build /app/publish .

# Exponer el puerto
EXPOSE 5000

# Variables de entorno por defecto
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Ejecutar la aplicación
ENTRYPOINT ["dotnet", "MedicineBackend.dll"]
