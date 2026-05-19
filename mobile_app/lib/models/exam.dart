class Exam {
  final int id;
  final int moduleId;
  final String title;
  final String? moduleTitle;
  final String? divisionName;
  final String questionSetName;
  final DateTime startDate;
  final DateTime endDate;
  final bool? hasResult; // true if user already submitted
  final int? durationMinutes; // null = use endDate as deadline
  final String? moduleImageUrl;
  final int? questionCount;

  Exam({
    required this.id,
    required this.moduleId,
    required this.title,
    this.moduleTitle,
    this.divisionName,
    this.questionSetName = "Default",
    required this.startDate,
    required this.endDate,
    this.hasResult,
    this.durationMinutes,
    this.moduleImageUrl,
    this.questionCount,
  });

  bool get isActive {
    final now = DateTime.now();
    return now.isAfter(startDate) && now.isBefore(endDate);
  }

  bool get isUpcoming => DateTime.now().isBefore(startDate);
  bool get isExpired => DateTime.now().isAfter(endDate);

  factory Exam.fromJson(Map<String, dynamic> json) {
    String? modTitle;
    String? divName;
    String? modImageUrl;
    if (json['module'] != null && json['module'] is Map) {
      modTitle = json['module']['title'];
      modImageUrl = json['module']['image_url'];
      if (json['module']['division'] != null && json['module']['division'] is Map) {
         divName = json['module']['division']['name'];
      }
    }

    return Exam(
      id: json['id'],
      moduleId: json['module_id'] ?? 0,
      title: json['title'] ?? '',
      moduleTitle: modTitle ?? json['module_title'],
      divisionName: divName ?? json['division_name'],
      questionSetName: json['question_set_name'] ?? 'Default',
      startDate: DateTime.parse(json['start_date']),
      endDate: DateTime.parse(json['end_date']),
      hasResult: json['has_result'],
      durationMinutes: json['duration_minutes'],
      moduleImageUrl: modImageUrl ?? json['module_image_url'],
      questionCount: json['question_count'],
    );
  }
}
