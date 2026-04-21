class Result {
  final int id;
  final String userId;
  final int examId;
  final double score;
  final bool? isPassed;
  final DateTime finishedAt;
  final String? examTitle;
  final String? moduleTitle;
  final Map<int, String>? userAnswers;

  Result({
    required this.id,
    required this.userId,
    required this.examId,
    required this.score,
    this.isPassed,
    required this.finishedAt,
    this.examTitle,
    this.moduleTitle,
    this.userAnswers,
  });

  factory Result.fromJson(Map<String, dynamic> json) {
    String? exTitle;
    String? modTitle;
    if (json['exam'] != null && json['exam'] is Map) {
      exTitle = json['exam']['title'];
      if (json['exam']['module'] != null && json['exam']['module'] is Map) {
        modTitle = json['exam']['module']['title'];
      }
    }

    Map<int, String>? parsedUserAnswers;
    if (json['user_answers'] != null) {
      final answers = json['user_answers'] as Map<String, dynamic>;
      parsedUserAnswers = answers.map((key, value) => MapEntry(int.parse(key), value.toString()));
    }

    return Result(
      id: json['id'],
      userId: json['user_id'] ?? '',
      examId: json['exam_id'] ?? 0,
      score: (json['score'] ?? 0).toDouble(),
      isPassed: json['is_passed'],
      finishedAt: DateTime.parse(json['finished_at'] ?? DateTime.now().toIso8601String()),
      examTitle: exTitle ?? json['exam_title'],
      moduleTitle: modTitle ?? json['module_title'],
      userAnswers: parsedUserAnswers,
    );
  }
}
