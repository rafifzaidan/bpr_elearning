class Module {
  final int id;
  final String title;
  final String? description;
  final String? fileUrl;
  final String? fileType; // 'pdf' | 'video'
  final int divisionId;

  Module({
    required this.id,
    required this.title,
    this.description,
    this.fileUrl,
    this.fileType,
    required this.divisionId,
  });

  factory Module.fromJson(Map<String, dynamic> json) {
    return Module(
      id: json['id'],
      title: json['title'] ?? '',
      description: json['description'],
      fileUrl: json['file_url'],
      fileType: json['file_type'],
      divisionId: json['division_id'] ?? 0,
    );
  }
}
