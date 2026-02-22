namespace MedicineBackend.Configuration;

public class InitialAdminSettings
{
    public string Email { get; set; }
    public string Password { get; set; }
    public string FullName { get; set; }
    public bool IsSuperAdmin { get; set; }
    //public string PermissionLevel { get; set; }
    public string Department { get; set; }
    public bool CreateOnStartup { get; set; }
}
