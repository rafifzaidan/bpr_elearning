import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/result.dart';
import '../models/question.dart';
import '../providers/exam_provider.dart';

class QuizReviewScreen extends StatefulWidget {
  final Result result;

  const QuizReviewScreen({super.key, required this.result});

  @override
  State<QuizReviewScreen> createState() => _QuizReviewScreenState();
}

class _QuizReviewScreenState extends State<QuizReviewScreen> {
  bool _isLoading = true;
  List<Question> _questions = [];

  @override
  void initState() {
    super.initState();
    Future.microtask(() => _loadQuestions());
  }

  Future<void> _loadQuestions() async {
    final examProv = Provider.of<ExamProvider>(context, listen: false);
    
    try {
      // Find the exam to get the moduleId
      final exam = examProv.exams.firstWhere((e) => e.id == widget.result.examId);
      
      // Fetch questions for this module
      await examProv.fetchQuestions(exam.moduleId);
      
      if (mounted) {
        setState(() {
          _questions = examProv.questions;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gagal memuat soal untuk review')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new, size: 22),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Review Jawaban',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _isLoading 
                  ? const Center(child: CircularProgressIndicator())
                  : _questions.isEmpty
                      ? const Center(child: Text('Data soal tidak ditemukan'))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          itemCount: _questions.length,
                          itemBuilder: (context, index) {
                            final question = _questions[index];
                            return _buildReviewItem(question, index, _questions.length);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewItem(Question question, int index, int total) {
    final colorScheme = Theme.of(context).colorScheme;
    
    // Get user's answer from the result object
    final userAnswer = widget.result.userAnswers?[question.id]?.toString().toUpperCase().trim();
    final correctAns = question.correctAns.toUpperCase().trim();
    
    final sortedKeys = question.options.keys.toList()..sort();

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Question Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Soal ${index + 1} dari $total',
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (userAnswer == correctAns)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('BENAR', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('SALAH', style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Question text
          Text(
            question.text,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, height: 1.4),
          ),
          const SizedBox(height: 20),

          // Options
          ...sortedKeys.map((key) {
            final currentKey = key.toUpperCase().trim();
            final isUserChoice = userAnswer == currentKey;
            final isCorrectChoice = correctAns == currentKey;
            
            Color bgColor = Colors.grey.withValues(alpha: 0.05);
            Color borderColor = Colors.grey.withValues(alpha: 0.2);
            Color textColor = Colors.grey[800]!;
            IconData? icon;
            Color iconColor = Colors.transparent;

            if (isCorrectChoice) {
              bgColor = Colors.green.withValues(alpha: 0.1);
              borderColor = Colors.green;
              textColor = Colors.green.shade700;
              icon = Icons.check_circle_rounded;
              iconColor = Colors.green;
            } else if (isUserChoice && !isCorrectChoice) {
              bgColor = Colors.red.withValues(alpha: 0.1);
              borderColor = Colors.red;
              textColor = Colors.red.shade700;
              icon = Icons.cancel_rounded;
              iconColor = Colors.red;
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: borderColor, width: isUserChoice || isCorrectChoice ? 1.5 : 1),
              ),
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: isUserChoice || isCorrectChoice 
                          ? iconColor 
                          : Colors.grey.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        key,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isUserChoice || isCorrectChoice ? Colors.white : Colors.grey[700],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      question.options[key] ?? '',
                      style: TextStyle(
                        fontSize: 14,
                        color: textColor,
                        fontWeight: isUserChoice || isCorrectChoice ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ),
                  if (icon != null)
                    Icon(icon, color: iconColor, size: 20),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
