class Question {
  final int id;
  final int moduleId;
  final String text;
  final Map<String, String> options; // {"A": "...", "B": "...", "C": "...", "D": "..."}
  final String correctAns; // "A" | "B" | "C" | "D"
  final int weight;

  Question({
    required this.id,
    required this.moduleId,
    required this.text,
    required this.options,
    required this.correctAns,
    this.weight = 1,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    // Parse options from JSON — could be a Map or String
    Map<String, String> parsedOptions = {};
    if (json['options'] != null) {
      final opts = json['options'];
      if (opts is Map) {
        parsedOptions = Map<String, String>.from(
          opts.map((k, v) => MapEntry(k.toString(), v.toString())),
        );
      }
    }

    return Question(
      id: json['id'],
      moduleId: json['module_id'] ?? 0,
      text: json['text'] ?? '',
      options: parsedOptions,
      correctAns: json['correct_ans'] ?? '',
      weight: json['weight'] ?? 1,
    );
  }
}
