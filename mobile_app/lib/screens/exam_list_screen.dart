import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/exam_provider.dart';
import '../providers/module_provider.dart';
import '../models/exam.dart';
import '../models/result.dart';
import 'exam_screen.dart';
import 'quiz_review_screen.dart';

class ExamListScreen extends StatefulWidget {
  const ExamListScreen({super.key});

  @override
  State<ExamListScreen> createState() => _ExamListScreenState();
}

class _ExamListScreenState extends State<ExamListScreen> {
  String searchQuery = '';
  String selectedCategory = 'Semua';

  String getCategoryForExam(Exam exam) {
    return exam.moduleTitle ?? 'Lainnya';
  }

  @override
  void initState() {
    super.initState();
    final examProv = Provider.of<ExamProvider>(context, listen: false);
    final moduleProv = Provider.of<ModuleProvider>(context, listen: false);
    Future.microtask(() {
      examProv.initStreams();
      moduleProv.initModuleStream();
    });
  }

  @override
  Widget build(BuildContext context) {
    final examProv = Provider.of<ExamProvider>(context);
    final moduleProv = Provider.of<ModuleProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final colorScheme = theme.colorScheme;
    final dateFormat = DateFormat('dd MMM yyyy');

    // Extract dynamic modules from the modules table (via provider)
    // This ensures all modules from the web admin appear, even if they have no exams yet
    final dynamicModules = moduleProv.modules
        .map((m) => m.title)
        .toSet()
        .toList();
    dynamicModules.sort(); 
    
    final List<String> filters = ['Semua', ...dynamicModules];

    // Ensure selectedCategory is still valid, else reset to 'Semua'
    if (!filters.contains(selectedCategory)) {
       selectedCategory = 'Semua';
    }

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
                  Row(
                    children: [
                      if (Navigator.canPop(context)) ...[
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.arrow_back),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                        const SizedBox(width: 16),
                      ],
                      const Text(
                        'Daftar Pelatihan',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
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
                itemCount: filters.length,
                itemBuilder: (context, index) {
                  final namaKategori = filters[index];
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
                        filters[index],
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
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 1.2, // Back to previous ratio
                          ),
                          itemCount: filteredExams.length,
                          itemBuilder: (context, index) {
                            final exam = filteredExams[index];
                            final canTakeExam = exam.isActive && exam.hasResult != true;
                            
                            // Determine status and color
                            String statusText = '';
                            Color statusColor = Colors.grey;
                            String dynamicDateText = '';
                            
                            if (exam.hasResult == true) {
                              statusText = 'SELESAI';
                              statusColor = Colors.green;
                              // Find matching result to get completion date
                              final matchingResult = examProv.results.firstWhere(
                                (r) => r.examId == exam.id,
                                orElse: () => Result(id: 0, userId: '', examId: 0, score: 0.0, finishedAt: DateTime.now()),
                              );
                              dynamicDateText = 'Selesai: ${dateFormat.format(matchingResult.finishedAt.toLocal())}';
                            } else if (exam.isActive) {
                              statusText = 'BERJALAN';
                              statusColor = theme.primaryColor;
                              dynamicDateText = 'Batas: ${dateFormat.format(exam.endDate.toLocal())}';
                            } else if (exam.isUpcoming) {
                              statusText = 'MENDATANG';
                              statusColor = Colors.orange;
                              dynamicDateText = 'Mulai: ${dateFormat.format(exam.startDate.toLocal())}';
                            } else {
                              statusText = 'BERAKHIR';
                              statusColor = Colors.red;
                              dynamicDateText = 'Berakhir: ${dateFormat.format(exam.endDate.toLocal())}';
                            }

                            return Card(
                              elevation: 0,
                              color: Colors.transparent,
                              margin: EdgeInsets.zero,
                              child: InkWell(
                                onTap: () {
                                  if (exam.hasResult == true) {
                                    final matchingResult = examProv.results.firstWhere(
                                      (r) => r.examId == exam.id,
                                      orElse: () => Result(id: 0, userId: '', examId: 0, score: 0.0, finishedAt: DateTime.now()),
                                    );
                                    if (matchingResult.id != 0) {
                                      Navigator.push(context, MaterialPageRoute(builder: (_) => QuizReviewScreen(result: matchingResult)));
                                    }
                                  } else if (exam.isActive) {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => ExamScreen(exam: exam)));
                                  } else if (exam.isUpcoming) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Pelatihan "${exam.title}" belum dimulai.'),
                                        backgroundColor: Colors.orange,
                                        behavior: SnackBarBehavior.floating,
                                      ),
                                    );
                                  } else if (exam.isExpired) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Pelatihan "${exam.title}" sudah berakhir.'),
                                        backgroundColor: Colors.red,
                                        behavior: SnackBarBehavior.floating,
                                      ),
                                    );
                                  }
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: theme.cardTheme.color,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: isDark ? Colors.grey[800]! : Colors.grey.shade200),
                                    boxShadow: isDark ? [] : [
                                      BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      // Inner-Top Gradient Container
                                      Expanded(
                                        flex: 3, // Reverted to previous size
                                        child: Container(
                                          decoration: BoxDecoration(
                                            gradient: LinearGradient(
                                              begin: Alignment.topLeft,
                                              end: Alignment.bottomRight,
                                              colors: [
                                                statusColor.withOpacity(0.2),
                                                statusColor.withOpacity(0.02),
                                              ],
                                            ),
                                            borderRadius: const BorderRadius.only(
                                              topLeft: Radius.circular(16),
                                              topRight: Radius.circular(16),
                                            ),
                                          ),
                                          child: Stack(
                                            children: [
                                              Center(
                                                child: Icon(
                                                  exam.hasResult == true ? Icons.check_circle_rounded : Icons.school_rounded,
                                                  size: 32, // Reverted to previous size
                                                  color: statusColor,
                                                ),
                                              ),
                                              Positioned(
                                                top: 8,
                                                right: 8,
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: statusColor,
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    statusText,
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 8,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      // Inner-Bottom Content Container
                                      Expanded(
                                        flex: 7, // Reverted to previous size
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: theme.primaryColor.withOpacity(0.1),
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                child: Text(
                                                  exam.moduleTitle ?? 'Umum',
                                                  style: TextStyle(
                                                    color: theme.primaryColor,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(height: 6),
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
                                              const Spacer(),
                                              Row(
                                                children: [
                                                  Icon(Icons.schedule, size: 10, color: Colors.grey[500]),
                                                  const SizedBox(width: 4),
                                                  Expanded(
                                                    child: Text(
                                                      dynamicDateText,
                                                      style: TextStyle(
                                                        fontSize: 9,
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
