import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/exam.dart';
import '../models/question.dart';
import '../providers/exam_provider.dart';
import '../providers/module_provider.dart';
import 'pdf_viewer_screen.dart';

class ExamScreen extends StatefulWidget {
  final Exam exam;

  const ExamScreen({super.key, required this.exam});

  @override
  State<ExamScreen> createState() => _ExamScreenState();
}

class _ExamScreenState extends State<ExamScreen> {
  final Map<int, String> _answers = {}; // questionId → selected answer
  int _currentIndex = 0;
  bool _isSubmitting = false;
  bool _isLoaded = false;
  bool _quizStarted = false;
  dynamic _module; // Store the associated module

  // Timer
  Timer? _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();

    final moduleProv = Provider.of<ModuleProvider>(context, listen: false);
    final examProv = Provider.of<ExamProvider>(context, listen: false);

    // Find the module
    try {
      _module = moduleProv.modules.firstWhere((m) => m.id == widget.exam.moduleId);
    } catch (_) {
      _module = null;
    }

    // Calculate remaining time
    _remaining = widget.exam.endDate.difference(DateTime.now());
    if (_remaining.isNegative) _remaining = Duration.zero;

    // Load questions
    Future.microtask(() async {
      await examProv.fetchQuestions(widget.exam.moduleId);
      if (mounted) setState(() => _isLoaded = true);
    });
  }

  void _startQuiz() {
    setState(() {
      _quizStarted = true;
    });

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _remaining = widget.exam.endDate.difference(DateTime.now());
        if (_remaining.isNegative) {
          _remaining = Duration.zero;
          timer.cancel();
          _autoSubmit();
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    final hours = d.inHours;
    final minutes = d.inMinutes.remainder(60);
    final seconds = d.inSeconds.remainder(60);
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  void _autoSubmit() {
    if (!_isSubmitting) _submitExam();
  }

  Future<void> _submitExam() async {
    final examProv = Provider.of<ExamProvider>(context, listen: false);

    setState(() => _isSubmitting = true);

    try {
      final score =
          await examProv.submitExam(widget.exam.id, _answers);

      _timer?.cancel();

      if (mounted) {
        // Show result dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20)),
            title: const Text('Hasil Ujian', textAlign: TextAlign.center),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  score >= 75 ? Icons.emoji_events_rounded : Icons.info_outline_rounded,
                  size: 60,
                  color: score >= 75 ? Colors.amber : Colors.orange,
                ),
                const SizedBox(height: 16),
                Text(
                  score.toStringAsFixed(1),
                  style: const TextStyle(
                      fontSize: 48, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'dari 100',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 12),
                Text(
                  score >= 75 ? '🎉 Selamat, Anda LULUS!' : 'Belum lulus. Tetap semangat!',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: score >= 75 ? Colors.green : Colors.red,
                  ),
                ),
              ],
            ),
            actions: [
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).pop();
                  },
                  child: const Text('Kembali'),
                ),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal submit: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final examProv = Provider.of<ExamProvider>(context);
    final questions = examProv.questions;
    final colorScheme = Theme.of(context).colorScheme;

    final isTimeLow = _remaining.inMinutes < 5 && _remaining.inSeconds > 0;

    return PopScope(
      canPop: !_quizStarted, // Allow pop if quiz hasn't started
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _quizStarted) {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Keluar dari ujian?'),
              content: const Text(
                  'Jawaban Anda akan hilang jika keluar sekarang.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Batal'),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).pop();
                  },
                  child: const Text('Keluar',
                      style: TextStyle(color: Colors.red)),
                ),
              ],
            ),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(_quizStarted ? widget.exam.title : 'Persiapan Ujian'),
          centerTitle: true,
          actions: [
            if (_quizStarted)
              // Timer badge
              Container(
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isTimeLow
                      ? Colors.red.withValues(alpha: 0.15)
                      : colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.timer_outlined,
                        size: 16,
                        color: isTimeLow ? Colors.red : colorScheme.primary),
                    const SizedBox(width: 4),
                    Text(
                      _formatDuration(_remaining),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isTimeLow ? Colors.red : colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        body: !_isLoaded || examProv.isLoading
            ? const Center(child: CircularProgressIndicator())
            : !_quizStarted 
                ? _buildPreparationView()
                : questions.isEmpty
                    ? const Center(child: Text('Tidak ada soal untuk ujian ini'))
                    : Column(
                    children: [
                      // Progress bar
                      LinearProgressIndicator(
                        value: questions.isNotEmpty
                            ? (_currentIndex + 1) / questions.length
                            : 0,
                        backgroundColor: Colors.grey[200],
                        minHeight: 4,
                      ),

                      // Question
                      Expanded(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(20),
                          child: _buildQuestion(
                              questions[_currentIndex], _currentIndex, questions.length),
                        ),
                      ),

                      // Navigation
                      Container(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        decoration: BoxDecoration(
                          color: Theme.of(context).scaffoldBackgroundColor,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 10,
                              offset: const Offset(0, -2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            if (_currentIndex > 0)
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () =>
                                      setState(() => _currentIndex--),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: const Text('Sebelumnya'),
                                ),
                              )
                            else
                              const Spacer(),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _currentIndex < questions.length - 1
                                  ? FilledButton(
                                      onPressed: () =>
                                          setState(() => _currentIndex++),
                                      style: FilledButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 14),
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                      ),
                                      child: const Text('Selanjutnya'),
                                    )
                                  : FilledButton(
                                      onPressed:
                                          _isSubmitting ? null : _submitExam,
                                      style: FilledButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 14),
                                        backgroundColor: Colors.green,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                      ),
                                      child: _isSubmitting
                                          ? const SizedBox(
                                              width: 20,
                                              height: 20,
                                              child:
                                                  CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: Colors.white,
                                              ),
                                            )
                                          : const Text('Submit Jawaban'),
                                    ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
      ),
    );
  }

  Widget _buildPreparationView() {
    final colorScheme = Theme.of(context).colorScheme;
    final moduleProv = Provider.of<ModuleProvider>(context, listen: false);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Module Info Card
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
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: colorScheme.primary.withValues(alpha: 0.2),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.exam.title,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _module?.title ?? 'Modul Pelatihan',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // 2. Material Section
          const Text(
            'Materi Pelatihan',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          if (_module != null && _module!.fileUrl != null)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: colorScheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: colorScheme.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _module!.fileType == 'video' ? Icons.play_circle_fill : Icons.picture_as_pdf,
                          color: colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _module!.title,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Text(
                              'Silakan pelajari materi ini sebelum mengerjakan kuis.',
                              style: TextStyle(color: Colors.grey[600], fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        // Import PDF Viewer screen logic or navigate
                        final url = await moduleProv.getFileUrl(_module!.fileUrl!);
                        if (url != null && mounted) {
                          if (_module!.fileType == 'pdf') {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => PdfViewerScreen(url: url, title: _module!.title),
                              ),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pemutar video belum tersedia')));
                          }
                        }
                      },
                      icon: const Icon(Icons.menu_book_rounded),
                      label: const Text('Buka Materi Sekarang'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            const Text('Tidak ada materi khusus untuk pelatihan ini.'),

          const SizedBox(height: 40),

          // 3. Instruction Section
          const Text(
            'Instruksi Kuis',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          _buildInstructionItem(Icons.timer_outlined, 'Batas waktu pengerjaan sesuai jadwal.'),
          _buildInstructionItem(Icons.help_outline, 'Jawab semua pertanyaan dengan teliti.'),
          _buildInstructionItem(Icons.check_circle_outline, 'Minimal skor kelulusan adalah 75.'),

          const SizedBox(height: 48),

          // 4. Start Button
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _startQuiz,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                backgroundColor: colorScheme.primary,
              ),
              child: const Text(
                'Mulai Kerjakan Soal',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructionItem(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Text(text, style: TextStyle(color: Colors.grey[700], fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildQuestion(Question question, int index, int total) {
    final colorScheme = Theme.of(context).colorScheme;
    final selectedAnswer = _answers[question.id];
    final sortedKeys = question.options.keys.toList()..sort();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Question number
        Text(
          'Soal ${index + 1} dari $total',
          style: TextStyle(
            color: Colors.grey[500],
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),

        // Question text
        Text(
          question.text,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, height: 1.4),
        ),
        const SizedBox(height: 24),

        // Options
        ...sortedKeys.map((key) {
          final isSelected = selectedAnswer == key;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () {
                setState(() => _answers[question.id] = key);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: isSelected
                      ? colorScheme.primary.withValues(alpha: 0.08)
                      : Colors.grey.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected
                        ? colorScheme.primary
                        : Colors.grey.withValues(alpha: 0.2),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? colorScheme.primary
                            : Colors.grey.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          key,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : Colors.grey[700],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        question.options[key] ?? '',
                        style: TextStyle(
                          fontSize: 15,
                          color: isSelected
                              ? colorScheme.primary
                              : Colors.grey[800],
                        ),
                      ),
                    ),
                    if (isSelected)
                      Icon(Icons.check_circle_rounded,
                          color: colorScheme.primary, size: 22),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }
}
