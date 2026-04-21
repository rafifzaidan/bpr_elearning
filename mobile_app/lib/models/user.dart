class User {
  final String id; // UUID from Supabase Auth
  final String nip;
  final String fullName;
  final int divisionId;
  final String? divisionName;
  final String role; // EMPLOYEE | ADMIN | LEADER
  final bool mfaEnabled;
  final bool mustChangePw;
  final String? avatarUrl;

  User({
    required this.id,
    required this.nip,
    required this.fullName,
    required this.divisionId,
    this.divisionName,
    required this.role,
    this.mfaEnabled = false,
    this.mustChangePw = true,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json, {String? authAvatarUrl}) {
    // Handle joined division data if present
    String? divName;
    if (json['division'] != null && json['division'] is Map) {
      divName = json['division']['name'];
    }

    return User(
      id: json['id'],
      nip: json['nip'] ?? '',
      fullName: json['full_name'] ?? 'User',
      divisionId: json['division_id'] ?? 0,
      divisionName: divName ?? json['division_name'],
      role: json['role'] ?? 'EMPLOYEE',
      mfaEnabled: json['mfa_enabled'] ?? false,
      mustChangePw: json['must_change_pw'] ?? true,
      avatarUrl: authAvatarUrl, // Prioritaskan dari auth metadata jika diteruskan
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nip': nip,
      'full_name': fullName,
      'division_id': divisionId,
      'division_name': divisionName,
      'role': role,
      'mfa_enabled': mfaEnabled,
      'must_change_pw': mustChangePw,
      'avatar_url': avatarUrl, // Simpan ke lokal cache
    };
  }
}
