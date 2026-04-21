import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/exam_provider.dart';
import '../providers/module_provider.dart';
import '../models/exam.dart';
import 'exam_screen.dart';
import 'exam_list_screen.dart';
import 'module_detail_screen.dart';
import 'quiz_review_screen.dart';
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    final moduleProv = Provider.of<ModuleProvider>(context, listen: false);
    final examProv = Provider.of<ExamProvider>(context, listen: false);
    Future.microtask(() {
      moduleProv.initModuleStream();
      examProv.initStreams();
    });
  }

  void _navigateToModule(BuildContext context, Exam exam) {
    final moduleProv = Provider.of<ModuleProvider>(context, listen: false);
    final module = moduleProv.modules.cast<dynamic>().firstWhere(
      (m) => m.id == exam.moduleId,
      orElse: () => null,
    );
    if (module != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ModuleDetailScreen(module: module),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Modul tidak ditemukan.')),
      );
    }
  }

  IconData _getIconForModule(String title) {
    final lowerTitle = title.toLowerCase();
    if (lowerTitle.contains('pengenalan') || lowerTitle.contains('intro')) {
      return Icons.info_outline;
    } else if (lowerTitle.contains('elektronik') || lowerTitle.contains('electronic')) {
      return Icons.electrical_services;
    } else if (lowerTitle.contains('office') || lowerTitle.contains('kantor')) {
      return Icons.edit;
    } else if (lowerTitle.contains('geo')) {
      return Icons.public;
    }
    return Icons.menu_book_rounded;
  }

  String _monthName(int month) {
    const months = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return months[month];
  }

  Widget _buildStatsSection(BuildContext context) {
    final examProv = Provider.of<ExamProvider>(context);
    final results = examProv.results;
    final exams = examProv.exams;

    // Calculate Accuracy
    double accuracy = 0.0;
    if (results.isNotEmpty) {
      double totalScore = results.fold(0, (sum, item) => sum + item.score);
      accuracy = totalScore / results.length;
    }

    // Calculate Progress
    int progress = 0;
    if (exams.isNotEmpty) {
      final completed = exams.where((e) => e.hasResult == true).length;
      progress = ((completed / exams.length) * 100).round();
    }

    // Calculate Deadline
    String deadlinePrefix = "TIDAK ADA TENGGAT";
    String examTitle = "Semua Selesai!";
    
    final pendingExams = exams.where((e) => (e.isActive || e.isUpcoming) && e.hasResult != true).toList();
    if (pendingExams.isNotEmpty) {
      pendingExams.sort((a, b) => a.endDate.compareTo(b.endDate));
      final nearest = pendingExams.first;
      examTitle = nearest.title;
      final diff = nearest.endDate.difference(DateTime.now());
      if (diff.inDays > 0) {
        deadlinePrefix = "TENGGAT ${diff.inDays} HARI LAGI - KUIS";
      } else if (diff.inHours > 0) {
        deadlinePrefix = "TENGGAT ${diff.inHours} JAM LAGI - KUIS";
      } else {
        deadlinePrefix = "TENGGAT HARI INI - KUIS";
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Deadline Card
            Expanded(
              flex: 11,
              child: GestureDetector(
                onTap: () {
                  if (pendingExams.isNotEmpty) {
                    _navigateToModule(context, pendingExams.first);
                  }
                },
                child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.lightBlue.shade300, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.flash_on, color: Colors.black87, size: 24),
                    const SizedBox(height: 12),
                    Text(
                      deadlinePrefix,
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      examTitle,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: Colors.black87,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 16),
                    if (pendingExams.isNotEmpty)
                      const Text(
                        "Kerjakan Sekarang",
                        style: TextStyle(
                          color: Colors.orange,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
            const SizedBox(width: 12),
            // Circular Stats
            Expanded(
              flex: 9,
              child: Row(
                children: [
                  _buildCircularStat(
                    title: "Progres Belajar",
                    percentage: progress.toDouble(),
                    color: Colors.orange,
                  ),
                  const SizedBox(width: 8),
                  _buildCircularStat(
                    title: "Akurasi",
                    percentage: accuracy,
                    color: Colors.blue.shade600,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCircularStat({required String title, required double percentage, required Color color}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 48,
                  height: 48,
                  child: CircularProgressIndicator(
                    value: percentage / 100,
                    backgroundColor: Colors.grey.shade100,
                    color: color,
                    strokeWidth: 5,
                  ),
                ),
                Text(
                  "${percentage.toStringAsFixed(0)}%",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 10,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuizHistorySection(BuildContext context) {
    final examProv = Provider.of<ExamProvider>(context);
    final results = examProv.results;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Riwayat Kuis',
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const ExamListScreen()),
                  );
                },
                child: const Text(
                  'View All',
                  style: TextStyle(
                    color: Color(0xFF00BFFF),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (results.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              'Belum ada riwayat kuis.',
              style: TextStyle(color: Colors.grey),
            ),
          )
        else
          ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: results.length > 3 ? 3 : results.length, // Show top 3
            itemBuilder: (context, index) {
              final result = results[index];
              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => QuizReviewScreen(result: result),
                    ),
                  );
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: (result.isPassed ?? false) ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                        (result.isPassed ?? false) ? Icons.emoji_events : Icons.cancel,
                        color: (result.isPassed ?? false) ? Colors.green : Colors.red,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            result.examTitle ?? 'Kuis',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.black87,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            result.moduleTitle ?? '-',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '${result.score.toStringAsFixed(0)}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: (result.isPassed ?? false) ? Colors.green : Colors.red,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
          ),
      ],
    );
  }

  Widget _buildSuggestedCoursesSection(BuildContext context) {
    final examProv = Provider.of<ExamProvider>(context);
    final suggestedExams = examProv.exams
        .where((e) => !e.isExpired && e.hasResult != true)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Saran Kursus',
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (suggestedExams.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              'Tidak ada kursus baru untuk saat ini.',
              style: TextStyle(color: Colors.grey),
            ),
          )
        else
          ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: suggestedExams.length,
            itemBuilder: (context, index) {
              final exam = suggestedExams[index];
              final deadlineText = exam.isActive
                  ? 'Tenggat: ${exam.endDate.toLocal().day} ${_monthName(exam.endDate.toLocal().month)} ${exam.endDate.toLocal().year}'
                  : 'Mulai: ${exam.startDate.toLocal().day} ${_monthName(exam.startDate.toLocal().month)} ${exam.startDate.toLocal().year}';
              return GestureDetector(
                onTap: () {
                  _navigateToModule(context, exam);
                },
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (exam.moduleTitle != null)
                              Text(
                                exam.moduleTitle!,
                                style: TextStyle(
                                  color: Colors.grey[500],
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            const SizedBox(height: 4),
                            Text(
                              exam.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: Colors.black87,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Icon(Icons.calendar_today_rounded,
                                    size: 11, color: Colors.grey[400]),
                                const SizedBox(width: 4),
                                Text(
                                  deadlineText,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey[500],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        exam.isActive ? 'Kerjakan\nSekarang' : 'Lihat\nMateri',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: exam.isActive
                              ? const Color(0xFF0284C7)
                              : Colors.orange,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 14,
                        color: exam.isActive
                            ? const Color(0xFF0284C7)
                            : Colors.orange,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final examProv = Provider.of<ExamProvider>(context);
    final user = auth.user;
    
    // Warna biru primary
    const primaryBlue = Color(0xFF00BFFF); 

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // 1. Header Area
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Halo,',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.fullName ?? 'Pengguna',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: primaryBlue.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          user?.divisionName ?? 'Jurusan',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: primaryBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: primaryBlue.withValues(alpha: 0.1),
                    child: Text(
                      (user?.fullName ?? 'P')[0].toUpperCase(),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: primaryBlue,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Konten Utama yang bisa di Scroll
            Expanded(
              child: examProv.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 2. Stats Section
                          _buildStatsSection(context),
                          
                          const SizedBox(height: 32),
                          
                          // 3. Quiz History Section
                          _buildQuizHistorySection(context),

                          const SizedBox(height: 32),
                          
                          // 4. Saran Kursus (Suggested Courses)
                          _buildSuggestedCoursesSection(context),

                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
