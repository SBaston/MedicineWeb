using System.Runtime.InteropServices;

namespace MedicineBackend.Services
{
    /// <summary>
    /// Carga manual de librerías nativas para Tesseract en Linux usando .NET NativeLibrary
    /// </summary>
    public static class NativeLibraryLoader
    {
        private static bool _isLoaded = false;
        private static readonly object _lock = new object();

        public static void EnsureLoaded()
        {
            if (_isLoaded) return;

            lock (_lock)
            {
                if (_isLoaded) return;

                if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                {
                    LoadLinuxLibraries();
                }
                // En Windows no hace falta, el paquete NuGet lo maneja

                _isLoaded = true;
            }
        }

        private static void LoadLinuxLibraries()
        {
            var possiblePaths = new[]
            {
                "/app/x64",
                "/app/runtimes/linux-x64/native",
                "/usr/local/lib",
                "/usr/lib/x86_64-linux-gnu",
                "/usr/lib"
            };

            // Lista de librerías con nombres alternativos
            var librariesToLoad = new[]
            {
                new [] { "libz.so.1", "libz.so" },
                new [] { "libpng16.so.16", "libpng16.so", "libpng.so" },
                new [] { "libjpeg.so.8", "libjpeg.so" },
                new [] { "libtiff.so.6", "libtiff.so.5", "libtiff.so" },
                new [] { "libwebp.so.7", "libwebp.so" },
                new [] { "libleptonica-1.82.0.so", "libleptonica.so.6", "libleptonica.so.5", "libleptonica.so", "liblept.so.5", "liblept.so" },
                new [] { "libtesseract50.so", "libtesseract.so.5", "libtesseract.so.4", "libtesseract.so" }
            };

            foreach (var libNames in librariesToLoad)
            {
                bool loaded = false;

                // Probar cada nombre alternativo
                foreach (var lib in libNames)
                {
                    foreach (var basePath in possiblePaths)
                    {
                        var fullPath = Path.Combine(basePath, lib);

                        if (File.Exists(fullPath))
                        {
                            try
                            {
                                var handle = NativeLibrary.Load(fullPath);
                                
                                if (handle != IntPtr.Zero)
                                {
                                    Console.WriteLine($"✅ Loaded: {fullPath}");
                                    loaded = true;
                                    break;
                                }
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"⚠️ Failed to load {fullPath}: {ex.Message}");
                            }
                        }
                    }

                    if (loaded) break;
                }

                if (!loaded)
                {
                    Console.WriteLine($"⚠️ Could not load any variant of: {string.Join(", ", libNames)}");
                }
            }
        }
    }
}