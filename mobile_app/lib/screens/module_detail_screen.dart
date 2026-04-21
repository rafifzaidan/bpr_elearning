import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/module.dart';
import '../providers/module_provider.dart';
import '../providers/exam_provider.dart';
import 'pdf_viewer_screen.dart';
import 'exam_screen.dart';

class ModuleDetailScreen extends StatelessWidget {
  final Module module;

  const ModuleDetailScreen({super.key, required this.module});

  @override
  Widget build(BuildContext context) {
    final moduleProv = Provider.of<ModuleProvider>(context, listen: false);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail Materi'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    colorScheme.primary,
                    colorScheme.primary.withValues(alpha: 0.7),
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      (module.fileType ?? 'pdf').toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    module.title,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Description
            if (module.description != null && module.description!.isNotEmpty) ...[
              const Text(
                'Deskripsi',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                module.description!,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
            ],

            // Open File Button
            if (module.fileUrl != null && module.fileUrl!.isNotEmpty)
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () async {
                    if (module.fileType == 'video') {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Pemutar video belum tersedia saat ini')),
                      );
                      return;
                    }

                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Menyiapkan dokumen...'), duration: Duration(seconds: 1)),
                    );

                    final url = await moduleProv.getFileUrl(module.fileUrl!);
                    
                    if (context.mounted) {
                      if (url != null) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PdfViewerScreen(
                              url: url,
                              title: module.title,
                            ),
                          ),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Gagal membuka dokumen PDF'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    }
                  },
                  icon: Icon(
                    module.fileType == 'video'
                        ? Icons.play_circle_filled_rounded
                        : Icons.open_in_new_rounded,
                  ),
                  label: Text(
                    module.fileType == 'video'
                        ? 'Tonton Video'
                        : 'Buka Dokumen PDF',
                    style: const TextStyle(fontSize: 16),
                  ),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.cloud_off_rounded, size: 40, color: Colors.grey),
                    SizedBox(height: 8),
                    Text(
                      'File belum tersedia',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),

            // Exam / Quiz Section
            _buildExamSection(context),
          ],
        ),
      ),
    );
  }

  Widget _buildExamSection(BuildContext context) {
    final examProv = Provider.of<ExamProvider>(context);
    final dateFormat = DateFormat('dd MMM yyyy, HH:mm');

    // Filter exams that belong to this module
    final moduleExams = examProv.exams
        .where((e) => e.moduleId == module.id)
        .toList();

    if (moduleExams.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 32),
        const Text(
          'Kuis Tersedia',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ...moduleExams.map((exam) {
          // Determine status
          Color statusColor;
          String statusText;
          IconData statusIcon;
          bool canStart = false;

          if (exam.hasResult == true) {
            statusColor = Colors.grey;
            statusText = 'Sudah Dikerjakan';
            statusIcon = Icons.check_circle_rounded;
          } else if (exam.isActive) {
            statusColor = Colors.green;
            statusText = 'Sedang Berlangsung';
            statusIcon = Icons.play_circle_rounded;
            canStart = true;
          } else if (exam.isUpcoming) {
            statusColor = Colors.orange;
            statusText = 'Akan Datang';
            statusIcon = Icons.schedule_rounded;
          } else {
            statusColor = Colors.red;
            statusText = 'Berakhir';
            statusIcon = Icons.cancel_rounded;
          }

          return Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title + Status Badge
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        exam.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(statusIcon, size: 14, color: statusColor),
                          const SizedBox(width: 4),
                          Text(
                            statusText,
                            style: TextStyle(
                              color: statusColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Date range
                Row(
                  children: [
                    Icon(Icons.calendar_today_rounded,
                        size: 14, color: Colors.grey[500]),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '${dateFormat.format(exam.startDate.toLocal())} — ${dateFormat.format(exam.endDate.toLocal())}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // Action Button
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: canStart
                        ? () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ExamScreen(exam: exam),
                              ),
                            );
                          }
                        : exam.isUpcoming
                            ? () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Kuis ini belum dimulai. Jadwal mulai: ${dateFormat.format(exam.startDate.toLocal())}',
                                    ),
                                    backgroundColor: Colors.orange,
                                  ),
                                );
                              }
                            : null,
                    style: FilledButton.styleFrom(
                      backgroundColor: canStart
                          ? null
                          : exam.isUpcoming
                              ? Colors.orange.shade400
                              : Colors.grey.shade400,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      canStart
                          ? 'Mulai Kuis'
                          : exam.hasResult == true
                              ? 'Sudah Selesai'
                              : exam.isUpcoming
                                  ? 'Belum Dimulai'
                                  : 'Kuis Berakhir',
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
