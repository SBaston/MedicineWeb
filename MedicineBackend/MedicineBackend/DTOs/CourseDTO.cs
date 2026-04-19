// ═══════════════════════════════════════════════════════════════
// DTOs/Doctor/CourseDtos.cs
// DTOs para cursos y módulos
// ═══════════════════════════════════════════════════════════════

using System.ComponentModel.DataAnnotations;

namespace MedicineBackend.DTOs.DoctorDTO;

// ══════════════════════════════════════════════════════════
// COURSES
// ══════════════════════════════════════════════════════════
public class CourseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Level { get; set; }
    public string? Category { get; set; }
    public int? DurationMinutes { get; set; }
    public string? ContentType { get; set; }
    public string? ContentUrl { get; set; }
    public string? ArticleContent { get; set; }
    public string Language { get; set; } = "Español";
    public string? Prerequisites { get; set; }
    public string? LearningObjectives { get; set; }
    public bool IsPublished { get; set; }
    public bool IsVerified { get; set; }
    public int TotalEnrollments { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalRatings { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? PublishedAt { get; set; }
    public List<CourseModuleDto> Modules { get; set; } = new();
}

public class CreateCourseDto
{
    [Required(ErrorMessage = "El título es obligatorio")]
    [MaxLength(200, ErrorMessage = "El título no puede exceder los 200 caracteres")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "La descripción es obligatoria")]
    [MaxLength(2000, ErrorMessage = "La descripción no puede exceder los 2000 caracteres")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "El precio es obligatorio")]
    [Range(0.01, 10000, ErrorMessage = "El precio debe ser mayor que 0")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "El nivel es obligatorio")]
    [RegularExpression("^(Principiante|Intermedio|Avanzado)$", ErrorMessage = "Nivel no válido")]
    public string Level { get; set; } = string.Empty;

    [Required(ErrorMessage = "La categoría es obligatoria")]
    [MaxLength(100, ErrorMessage = "La categoría no puede exceder los 100 caracteres")]
    public string Category { get; set; } = string.Empty;

    [Range(1, 60000, ErrorMessage = "La duración debe ser entre 1 y 60000 minutos")]
    public int? DurationMinutes { get; set; }

    [MaxLength(20, ErrorMessage = "El tipo de contenido no es válido")]
    [RegularExpression("^(video_url|video_file|document|article)?$", ErrorMessage = "ContentType no válido")]
    public string? ContentType { get; set; }

    [MaxLength(1000, ErrorMessage = "La URL no puede exceder los 1000 caracteres")]
    public string? ContentUrl { get; set; }

    public string? ArticleContent { get; set; }

    [MaxLength(20, ErrorMessage = "El idioma no puede exceder los 20 caracteres")]
    public string? Language { get; set; }

    [MaxLength(1000, ErrorMessage = "Los requisitos no pueden exceder los 1000 caracteres")]
    public string? Prerequisites { get; set; }

    [MaxLength(2000, ErrorMessage = "Los objetivos no pueden exceder los 2000 caracteres")]
    public string? LearningObjectives { get; set; }
}

public class UpdateCourseDto
{
    [Required(ErrorMessage = "El título es obligatorio")]
    [MaxLength(200, ErrorMessage = "El título no puede exceder los 200 caracteres")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "La descripción es obligatoria")]
    [MaxLength(2000, ErrorMessage = "La descripción no puede exceder los 2000 caracteres")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "El precio es obligatorio")]
    [Range(0.01, 10000, ErrorMessage = "El precio debe ser mayor que 0")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "El nivel es obligatorio")]
    [RegularExpression("^(Principiante|Intermedio|Avanzado)$", ErrorMessage = "Nivel no válido")]
    public string Level { get; set; } = string.Empty;

    [Required(ErrorMessage = "La categoría es obligatoria")]
    [MaxLength(100, ErrorMessage = "La categoría no puede exceder los 100 caracteres")]
    public string Category { get; set; } = string.Empty;

    [Range(1, 60000, ErrorMessage = "La duración debe ser entre 1 y 60000 minutos")]
    public int? DurationMinutes { get; set; }

    [MaxLength(20)]
    [RegularExpression("^(video_url|video_file|document|article)?$", ErrorMessage = "ContentType no válido")]
    public string? ContentType { get; set; }

    [MaxLength(1000)]
    public string? ContentUrl { get; set; }

    public string? ArticleContent { get; set; }

    [MaxLength(1000, ErrorMessage = "Los requisitos no pueden exceder los 1000 caracteres")]
    public string? Prerequisites { get; set; }

    [MaxLength(2000, ErrorMessage = "Los objetivos no pueden exceder los 2000 caracteres")]
    public string? LearningObjectives { get; set; }
}

public class SetVideoUrlDto
{
    [Required]
    [MaxLength(1000)]
    public string Url { get; set; } = string.Empty;
}

public class SetArticleDto
{
    [Required]
    public string Content { get; set; } = string.Empty;
}

// ══════════════════════════════════════════════════════════
// COURSE MODULES
// ══════════════════════════════════════════════════════════
public class CourseModuleDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? VideoUrl { get; set; }
    public int? VideoDurationMinutes { get; set; }
    public int OrderIndex { get; set; }
    public bool IsFree { get; set; }
}

public class CreateCourseModuleDto
{
    [Required(ErrorMessage = "El título es obligatorio")]
    [MaxLength(200, ErrorMessage = "El título no puede exceder los 200 caracteres")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "El contenido es obligatorio")]
    [MaxLength(5000, ErrorMessage = "El contenido no puede exceder los 5000 caracteres")]
    public string Content { get; set; } = string.Empty;

    [Url(ErrorMessage = "La URL del vídeo no es válida")]
    [MaxLength(500, ErrorMessage = "La URL no puede exceder los 500 caracteres")]
    public string? VideoUrl { get; set; }

    [Range(0, 300, ErrorMessage = "La duración debe ser entre 0 y 300 minutos")]
    public int? VideoDurationMinutes { get; set; }

    public bool IsFree { get; set; }
}

public class UpdateCourseModuleDto
{
    [Required(ErrorMessage = "El título es obligatorio")]
    [MaxLength(200, ErrorMessage = "El título no puede exceder los 200 caracteres")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "El contenido es obligatorio")]
    [MaxLength(5000, ErrorMessage = "El contenido no puede exceder los 5000 caracteres")]
    public string Content { get; set; } = string.Empty;

    [Url(ErrorMessage = "La URL del vídeo no es válida")]
    [MaxLength(500, ErrorMessage = "La URL no puede exceder los 500 caracteres")]
    public string? VideoUrl { get; set; }

    [Range(0, 300, ErrorMessage = "La duración debe ser entre 0 y 300 minutos")]
    public int? VideoDurationMinutes { get; set; }

    public bool IsFree { get; set; }
}