class Exam {
  final int id;
  final int moduleId;
  final String title;
  final String? moduleTitle;
  final DateTime startDate;
  final DateTime endDate;
  final bool? hasResult; // true if user already submitted

  Exam({
    required this.id,
    required this.moduleId,
    required this.title,
    this.moduleTitle,
    required this.startDate,
    required this.endDate,
    this.hasResult,
  });

  bool get isActive {
    final now = DateTime.now();
    return now.isAfter(startDate) && now.isBefore(endDate);
  }

  bool get isUpcoming => DateTime.now().isBefore(startDate);
  bool get isExpired => DateTime.now().isAfter(endDate);

  factory Exam.fromJson(Map<String, dynamic> json) {
    String? modTitle;
    if (json['module'] != null && json['module'] is Map) {
      modTitle = json['module']['title'];
    }

    return Exam(
      id: json['id'],
      moduleId: json['module_id'] ?? 0,
      title: json['title'] ?? '',
      moduleTitle: modTitle ?? json['module_title'],
      startDate: DateTime.parse(json['start_date']),
      endDate: DateTime.parse(json['end_date']),
      hasResult: json['has_result'],
    );
  }
}
