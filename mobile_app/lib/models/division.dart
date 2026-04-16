class Division {
  final int id;
  final String name;
  final double passingGrade;

  Division({
    required this.id,
    required this.name,
    required this.passingGrade,
  });

  factory Division.fromJson(Map<String, dynamic> json) {
    return Division(
      id: json['id'],
      name: json['name'] ?? '',
      passingGrade: (json['passing_grade'] ?? 75.0).toDouble(),
    );
  }
}
