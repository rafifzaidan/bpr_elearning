import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/exam_provider.dart';
import '../models/result.dart';
import 'quiz_review_screen.dart';

class ResultScreen extends StatefulWidget {
  const ResultScreen({super.key});

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  int _selectedFilterIndex = 0;
  String searchQuery = '';
  final List<String> _filters = ['Semua', 'Lulus', 'Gagal'];

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
    final dateFormat = DateFormat('dd MMM yyyy');

    final allResults = examProv.results; 

    final exams = examProv.exams;

    double progress = 0.0;
    if (exams.isNotEmpty) {
      final completed = exams.where((e) => e.hasResult == true).length;
      progress = (completed / exams.length) * 100;
    }

    double accuracy = 0.0;
    if (allResults.isNotEmpty) {
      double totalScore = allResults.fold(0, (sum, item) => sum + item.score);
      accuracy = totalScore / allResults.length;
    }
    
    final results = allResults.where((result) {
      final matchesSearch = (result.examTitle ?? '').toLowerCase().contains(searchQuery.toLowerCase());
      
      bool matchesFilter = true;
      if (_selectedFilterIndex == 1) { // Lulus
        matchesFilter = result.isPassed == true;
      } else if (_selectedFilterIndex == 2) { // Gagal
        matchesFilter = result.isPassed != true;
      }
      
      return matchesSearch && matchesFilter;
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
                    'Riwayat Kuis',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _buildCircularStat(
                        title: 'Progres Belajar',
                        percentage: progress,
                        color: Colors.orange,
                        isDark: isDark,
                      ),
                      const SizedBox(width: 12),
                      _buildCircularStat(
                        title: 'Akurasi',
                        percentage: accuracy,
                        color: Colors.blue.shade600,
                        isDark: isDark,
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
                              hintText: 'Cari riwayat kuis...',
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
                  final isActive = index == _selectedFilterIndex;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedFilterIndex = index),
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

            // 3. Badges Cards GridView
            Expanded(
              child: examProv.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : results.isEmpty
                      ? const Center(
                          child: Text(
                            'Belum ada riwayat kuis.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.75, // Matching Courses card ratio
                          ),
                          itemCount: results.length,
                          itemBuilder: (context, index) {
                            final result = results[index];
                            final passed = result.isPassed == true;
                            // Badge properties based on pass/fail
                            final tagColor = passed ? Colors.green : Colors.red;
                            final finalLabel = passed ? 'Selesai' : 'Gagal';
                            final iconToUse = passed ? Icons.assignment_turned_in : Icons.assignment_late_outlined;

                            return Card(
                              elevation: 0,
                              color: Colors.transparent,
                              margin: EdgeInsets.zero,
                              child: InkWell(
                                onTap: () {
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => QuizReviewScreen(result: result)));
                                },
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
                                                tagColor.withOpacity(isDark ? 0.4 : 0.3),
                                                tagColor.withOpacity(0.05),
                                              ],
                                            ),
                                            borderRadius: const BorderRadius.only(
                                              topLeft: Radius.circular(20),
                                              topRight: Radius.circular(20),
                                            ),
                                          ),
                                          child: Center(
                                            child: Icon(
                                              iconToUse,
                                              size: 48,
                                              color: tagColor,
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
                                                  color: tagColor.withOpacity(0.1),
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                                child: Text(
                                                  finalLabel,
                                                  style: TextStyle(
                                                    color: tagColor,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                              Text(
                                                result.examTitle ?? 'Pelatihan',
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
                                                  height: 1.2,
                                                ),
                                              ),
                                              Text(
                                                'Skor: ${result.score.toStringAsFixed(0)}',
                                                style: TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 12,
                                                  color: passed ? Colors.green : Colors.red,
                                                ),
                                              ),
                                              Row(
                                                children: [
                                                  Icon(Icons.event_available, size: 12, color: Colors.grey[500]),
                                                  const SizedBox(width: 4),
                                                  Expanded(
                                                    child: Text(
                                                      dateFormat.format(result.finishedAt.toLocal()),
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

  Widget _buildCircularStat({
    required String title,
    required double percentage,
    required Color color,
    required bool isDark,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: isDark ? Colors.grey[800] : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isDark ? Colors.grey[700]! : Colors.grey[200]!),
          boxShadow: isDark ? [] : [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 56,
                  height: 56,
                  child: CircularProgressIndicator(
                    value: percentage / 100,
                    backgroundColor: isDark ? Colors.grey[700] : Colors.grey.shade100,
                    color: color,
                    strokeWidth: 6,
                  ),
                ),
                Text(
                  "${percentage.toStringAsFixed(0)}%",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
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
}
