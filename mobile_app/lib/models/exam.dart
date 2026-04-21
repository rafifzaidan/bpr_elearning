class Exam {
  final int id;
  final int moduleId;
  final String title;
  final String? moduleTitle;
  final String? divisionName;
  final DateTime startDate;
  final DateTime endDate;
  final bool? hasResult; // true if user already submitted

  Exam({
    required this.id,
    required this.moduleId,
    required this.title,
    this.moduleTitle,
    this.divisionName,
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
    String? divName;
    if (json['module'] != null && json['module'] is Map) {
      modTitle = json['module']['title'];
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
      startDate: DateTime.parse(json['start_date']),
      endDate: DateTime.parse(json['end_date']),
      hasResult: json['has_result'],
    );
  }
}
