import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/exam_provider.dart';
import '../models/exam.dart';
import 'exam_screen.dart';

class ExamListScreen extends StatefulWidget {
  const ExamListScreen({super.key});

  @override
  State<ExamListScreen> createState() => _ExamListScreenState();
}

class _ExamListScreenState extends State<ExamListScreen> {
  String searchQuery = '';
  String selectedCategory = 'Semua';
  final List<String> _filters = ['Semua', 'Regulasi', 'Soft Skill', 'IT & Security'];

  String getCategoryForExam(Exam exam) {
    // Generate kategori dinamis namun konsisten berbasis konten atau fallback via ID
    final text = (exam.title + (exam.moduleTitle ?? '')).toLowerCase();
    if (text.contains('it') || text.contains('security') || text.contains('teknologi')) return 'IT & Security';
    if (text.contains('regulasi') || text.contains('hukum') || text.contains('patuh')) return 'Regulasi';
    if (text.contains('soft') || text.contains('komunikasi') || text.contains('layanan')) return 'Soft Skill';
    
    // Fallback assignment agar setiap course dpt masuk salah satu tab dari db asli
    final index = exam.id % 3;
    return ['Regulasi', 'Soft Skill', 'IT & Security'][index];
  }

  List<Exam> get filteredCourses {
    // ExamProvider is not accessible as class field, so we compute in build.
    // This getter is intentionally empty; see _buildFilteredCourses() instead.
    return [];
  }

  @override
  void initState() {
    super.initState();
    final examProv = Provider.of<ExamProvider>(context, listen: false);
    Future.microtask(() => examProv.initStreams());
  }

  @override
  Widget build(BuildContext context) {
    final examProv = Provider.of<ExamProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final colorScheme = theme.colorScheme;
    final dateFormat = DateFormat('dd MMM yyyy, HH:mm');

    final filteredExams = examProv.exams.where((exam) {
      final matchesSearch = exam.title.toLowerCase().contains(searchQuery.toLowerCase());
      final matchesCategory = selectedCategory == 'Semua' || getCategoryForExam(exam) == selectedCategory;
      return matchesSearch && matchesCategory;
    }).toList();

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Header Section
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Daftar Pelatihan',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                    decoration: BoxDecoration(
                      color: isDark ? colorScheme.surface : Colors.grey[100],
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? Colors.grey[800]! : Colors.transparent),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.search, color: Colors.grey[500]),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            onChanged: (value) {
                              setState(() {
                                searchQuery = value;
                              });
                            },
                            decoration: InputDecoration(
                              hintText: 'Cari course atau materi...',
                              hintStyle: TextStyle(color: Colors.grey[500]),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // 2. Kategori Filter
            SizedBox(
              height: 40,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                scrollDirection: Axis.horizontal,
                itemCount: _filters.length,
                itemBuilder: (context, index) {
                  final namaKategori = _filters[index];
                  final isActive = selectedCategory == namaKategori;
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        selectedCategory = namaKategori;
                      });
                    },
                    child: Container(
                      margin: const EdgeInsets.only(right: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      decoration: BoxDecoration(
                        color: isActive 
                            ? theme.primaryColor 
                            : (isDark ? colorScheme.surface : Colors.white),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isActive ? theme.primaryColor : (isDark ? Colors.grey[800]! : Colors.grey[300]!),
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _filters[index],
                        style: TextStyle(
                          color: isActive ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                          fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),

            // 3. Course Cards GridView
            Expanded(
              child: examProv.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filteredExams.isEmpty
                      ? const Center(
                          child: Text(
                            'Belum ada materi pelatihan.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.75, // Adjust for top/bottom inner split
                          ),
                          itemCount: filteredExams.length,
                          itemBuilder: (context, index) {
                            final exam = filteredExams[index];
                            final categoryName = getCategoryForExam(exam);
                            final levelTags = [
                              {'label': 'Pemula', 'color': Colors.green},
                              {'label': 'Menengah', 'color': Colors.blue},
                              {'label': 'Lanjutan', 'color': Colors.purple},
                            ];
                            // Memilih tag acak/berbasis ID supaya visual tag konsisten
                            final tag = levelTags[exam.id % levelTags.length];
                            final canTakeExam = exam.isActive && exam.hasResult != true;

                            return Card(
                              elevation: 0,
                              color: Colors.transparent,
                              margin: EdgeInsets.zero,
                              child: InkWell(
                                onTap: canTakeExam 
                                  ? () => Navigator.push(context, MaterialPageRoute(builder: (_) => ExamScreen(exam: exam)))
                                  : null,
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: theme.cardTheme.color,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: isDark ? Colors.grey[800]! : Colors.grey.shade200),
                                    boxShadow: isDark ? [] : [
                                      BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      // Inner-Top Gradient Container
                                      Expanded(
                                        flex: 4,
                                        child: Container(
                                          decoration: BoxDecoration(
                                            gradient: LinearGradient(
                                              begin: Alignment.topLeft,
                                              end: Alignment.bottomRight,
                                              colors: [
                                                theme.primaryColor.withOpacity(0.3),
                                                theme.primaryColor.withOpacity(0.05),
                                              ],
                                            ),
                                            borderRadius: const BorderRadius.only(
                                              topLeft: Radius.circular(20),
                                              topRight: Radius.circular(20),
                                            ),
                                          ),
                                          child: Center(
                                            child: Icon(
                                              Icons.school_rounded,
                                              size: 48,
                                              color: theme.primaryColor,
                                            ),
                                          ),
                                        ),
                                      ),
                                      // Inner-Bottom Content Container
                                      Expanded(
                                        flex: 6,
                                        child: Padding(
                                          padding: const EdgeInsets.all(12),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: (tag['color'] as Color).withOpacity(0.1),
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                                child: Text(
                                                  tag['label'] as String,
                                                  style: TextStyle(
                                                    color: tag['color'] as Color,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                              Text(
                                                exam.title,
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
                                                  height: 1.2,
                                                ),
                                              ),
                                              Row(
                                                children: [
                                                  Icon(Icons.schedule, size: 12, color: Colors.grey[500]),
                                                  const SizedBox(width: 4),
                                                  Expanded(
                                                    child: Text(
                                                      exam.isActive ? 'Sedang Berjalan' : 'Tenggat Waktu',
                                                      style: TextStyle(
                                                        fontSize: 10,
                                                        color: Colors.grey[500],
                                                      ),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
