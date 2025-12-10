const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

/**
 * PDF Service
 * Generates PDF documents for clinical history
 * Migrated from BuildPDF.java - fillPdfConsumer method
 * Uses the same PDF templates as the Java version
 */
class PDFService {

  constructor() {
    this.templatesPath = path.join(__dirname, '../templates');
  }

  /**
   * Generate Clinical History PDF
   * Replicates exactly the structure of the Java PDF generation
   * @param {Object} data - Contains consumer, surgeries, and thematicAreas
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateClinicalHistoryPDF(data) {
    const { consumer, surgeries, thematicAreas } = data;
    const sdf = 'DD/MM/YYYY';

    // Load template 1 for page 1
    const template1Path = path.join(this.templatesPath, 'template_consumer_1.pdf');
    const template1Bytes = fs.readFileSync(template1Path);
    const pdfDoc1 = await PDFDocument.load(template1Bytes);

    // Fill page 1 form fields
    await this._fillPage1(pdfDoc1, consumer, surgeries, sdf);

    // Load template 2 for page 2 (screening data)
    const template2Path = path.join(this.templatesPath, 'template_consumer_2.pdf');
    const template2Bytes = fs.readFileSync(template2Path);
    const pdfDoc2 = await PDFDocument.load(template2Bytes);

    // Track where we are in thematic areas and questions
    const state = {
      ta_idx: 0,
      q_idx: 0,
      pr_idx: 0,
      sq_idx: 0,
      question_index: 0,
      sub_question_index: 0
    };

    // Fill page 2 with screening data
    let needsMorePages = await this._fillScreeningPage(pdfDoc2, thematicAreas, state, sdf);

    // Collect all screening pages (page 2 and any additional pages needed)
    const screeningPages = [pdfDoc2];

    // Create additional pages as needed (loop until all content is rendered)
    while (needsMorePages && state.ta_idx < thematicAreas.length) {
      const additionalPageBytes = fs.readFileSync(template2Path);
      const additionalPdfDoc = await PDFDocument.load(additionalPageBytes);
      needsMorePages = await this._fillScreeningPage(additionalPdfDoc, thematicAreas, state, sdf, true);
      screeningPages.push(additionalPdfDoc);
    }

    // Merge all pages into final document
    const finalPdf = await PDFDocument.create();

    // Copy page 1
    const [page1] = await finalPdf.copyPages(pdfDoc1, [0]);
    finalPdf.addPage(page1);

    // Copy all screening pages
    for (const screeningPdfDoc of screeningPages) {
      const [screeningPage] = await finalPdf.copyPages(screeningPdfDoc, [0]);
      finalPdf.addPage(screeningPage);
    }

    // Flatten and return
    const pdfBytes = await finalPdf.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Fill page 1 with personal and clinical information
   * Mirrors Java fillPdfConsumer method lines 725-795
   */
  async _fillPage1(pdfDoc, consumer, surgeries, sdf) {
    const form = pdfDoc.getForm();
    const rep = consumer.representative || {};
    const addr = consumer.address || {};

    // Helper function to safely set field
    const setField = (name, value) => {
      try {
        const field = form.getTextField(name);
        if (field) {
          field.setText(value || '');
        }
      } catch (e) {
        // Field may not exist in template
        console.log(`Field ${name} not found in template`);
      }
    };

    // User form
    setField('first_name', rep.name || '');
    setField('second_name', rep.surname || '');
    setField('birthday', rep.birthday ? moment(rep.birthday).format(sdf) : '');

    if (rep.birthPlace) {
      const birthPlace = rep.birthPlace.name ?
        `${rep.birthPlace.name} (${rep.birthPlace.provincial_code || ''})` : '';
      setField('birthplace', birthPlace);
    }

    setField('gender_male', rep.gender === true ? 'X' : '');
    setField('gender_female', rep.gender === false ? 'X' : '');
    setField('email', rep.email || '');

    // Address
    setField('street_type', addr.streetType || addr.street_type || '');
    setField('street', addr.street || '');
    setField('street_number', addr.streetNumber || addr.street_number || '');

    const municipality = addr.municipality ?
      `${addr.municipality} (${addr.province || ''})` : '';
    setField('municipality', municipality);
    setField('post_code', addr.postCode || addr.post_code || '');

    // Details
    setField('weight', rep.weight != null ? rep.weight.toString() : '');
    setField('height', rep.height != null ? rep.height.toString() : '');

    // Lifestyle - sedentaryLifestyle: true = sedentary, false = sportive
    const isSportive = rep.sedentaryLifestyle === false || rep.sedentary_lifestyle === false;
    const isSedentary = rep.sedentaryLifestyle === true || rep.sedentary_lifestyle === true;
    setField('lifestyle_sportive', isSportive ? 'X' : '');
    setField('lifestyle_sedentary', isSedentary ? 'X' : '');

    // Menstruation period
    const ageFirstMenstruation = rep.ageFirstMenstruation || rep.age_first_menstruation;
    setField('age_first_menstruation',
      ageFirstMenstruation && ageFirstMenstruation > 0 ? ageFirstMenstruation.toString() : '');

    const regularityMenstruation = rep.regularityMenstruation ?? rep.regularity_menstruation;
    setField('regularity_menstruation_yes', regularityMenstruation === true ? 'X' : '');
    setField('regularity_menstruation_no', regularityMenstruation === false ? 'X' : '');

    const durationMenstruation = rep.durationMenstruation || rep.duration_menstruation;
    setField('duration_menstruation',
      durationMenstruation && durationMenstruation > 0 ? durationMenstruation.toString() : '');

    // Obstetric Anamnesis - calculate pregnancy counts
    const gravidanceTypes = rep.gravidanceTypes || [];
    let totNat = 0, totCes = 0, totAbo = 0;

    gravidanceTypes.forEach(gt => {
      switch (gt.natur) {
        case 'nat': totNat++; break;
        case 'cae': totCes++; break;
        case 'abo': totAbo++; break;
      }
    });

    setField('pregnancies_number', `${totNat} Naturale, ${totCes} Cesareo, ${totAbo} Aborto`);

    // Surgeries area
    if (surgeries && surgeries.length > 0) {
      surgeries.forEach((surgery, i) => {
        const label = surgery.surgery ? surgery.surgery.label : '';
        setField(`surgery_name_${i}`, label);
        setField(`surgery_name_${i}_yes`, surgery.executed ? 'X' : '');
        setField(`surgery_name_${i}_no`, !surgery.executed ? 'X' : '');

        if (surgery.executed) {
          let description = '';
          if (surgery.surgery && !surgery.surgery.open_answer && surgery.children) {
            surgery.children.forEach(cs => {
              if (cs.executed && cs.surgery) {
                description += cs.surgery.label + '\n';
              }
            });
          } else {
            description = surgery.description || '';
          }
          setField(`surgery_description_${i}`, description);
        }
      });
    }

    // Drugs
    setField('medicine', rep.medicine || '');

    // Flatten the form
    form.flatten();
  }

  /**
   * Fill screening page with thematic areas and questions
   * Mirrors Java fillPdfConsumer method lines 800-870
   */
  async _fillScreeningPage(pdfDoc, thematicAreas, state, sdf, isContinuation = false) {
    const form = pdfDoc.getForm();
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Embed fonts for drawing
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Row layout configuration (based on template)
    // These values need to match the template's row positions
    const ROW_HEIGHT = 20;
    const FIRST_ROW_Y = height - 100; // Starting Y position from top
    const LEFT_MARGIN = 25;
    const ROW_WIDTH = width - 50;
    const FOOTER_MARGIN = 100; // Space reserved for footer at bottom of page

    // Calculate max rows dynamically based on available space (avoid footer overlap)
    const availableHeight = FIRST_ROW_Y - FOOTER_MARGIN;
    const MAX_ROWS = Math.floor(availableHeight / ROW_HEIGHT);
    let row = 0;

    // Helper to calculate Y position for a row (PDF coordinates start from bottom)
    const getRowY = (rowNum) => FIRST_ROW_Y - (rowNum * ROW_HEIGHT);

    // Helper to check if we can draw at this row (above footer)
    const canDrawAtRow = (rowNum) => {
      const y = getRowY(rowNum);
      return y > FOOTER_MARGIN;
    };

    // Helper to draw header row with red background and white bold text
    const drawHeaderRow = (rowNum, text) => {
      const y = getRowY(rowNum);
      if (y <= FOOTER_MARGIN) return; // Safety check - don't draw in footer area

      // Draw red background rectangle - RGB(249, 37, 82) = PinkCare red
      page.drawRectangle({
        x: LEFT_MARGIN,
        y: y - 5,
        width: ROW_WIDTH,
        height: ROW_HEIGHT,
        color: rgb(249/255, 37/255, 82/255),
      });

      // Draw white bold text
      page.drawText(text, {
        x: LEFT_MARGIN + 5,
        y: y + 2,
        size: 12,
        font: helveticaBold,
        color: rgb(1, 1, 1), // White
      });
    };

    // Helper to draw regular question row with black text
    const drawQuestionRow = (rowNum, text) => {
      const y = getRowY(rowNum);
      if (y <= FOOTER_MARGIN) return; // Safety check - don't draw in footer area

      page.drawText(text, {
        x: LEFT_MARGIN + 5,
        y: y + 2,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0), // Black
      });
    };

    // If continuing from previous page, reset row counter
    if (isContinuation) {
      // Continue where we left off
    }

    while (state.ta_idx < thematicAreas.length && row < MAX_ROWS) {
      const ta = thematicAreas[state.ta_idx];
      const questions = ta.screening_questions || [];

      // Only show thematic area title if we're starting fresh on this TA
      if (state.q_idx === 0 && state.pr_idx === 0 && state.sq_idx === 0) {
        let title = ta.label || '';
        if (ta.screening && ta.screening.insertion_date) {
          title += ` eseguito il ${moment(ta.screening.insertion_date).format(sdf)}`;
        }
        // Draw header with red background and white bold text
        drawHeaderRow(row, title);
        row++;
        state.question_index = 1;
      }

      while (state.q_idx < questions.length && row < MAX_ROWS) {
        const q = questions[state.q_idx];

        // Format main question answer
        let reply = '';
        if (q.given_answer != null && q.given_answer !== 0) {
          reply = ' -> ' + (q.given_answer === -1 ? 'NO' : 'SI');
        }

        // Only print main question if starting fresh on this question
        if (state.pr_idx === 0 && state.sq_idx === 0) {
          drawQuestionRow(row, `${state.question_index}) ${q.question}${reply}`);
          row++;
          state.sub_question_index = 1;
        }

        // Process protocol rules for sub-questions
        const rules = q.protocol_rules || [];
        while (state.pr_idx < rules.length && row < MAX_ROWS) {
          const pr = rules[state.pr_idx];

          // Check if this rule has sub_question and answer matches
          if (pr.has_sub_question && q.given_answer != null && q.given_answer === pr.answer) {
            // Get sub_questions from the question
            const subQuestions = q.sub_questions || [];

            while (state.sq_idx < subQuestions.length && row < MAX_ROWS) {
              const sq = subQuestions[state.sq_idx];

              // Format sub-question answer
              let subReply = '';
              if (sq.type_question === 'select') {
                subReply = sq.given_answer_string ? ` -> ${sq.given_answer_string}` : '';
              } else {
                if (sq.given_answer != null && sq.given_answer !== 0) {
                  subReply = ' -> ' + (sq.given_answer === -1 ? 'NO' : 'SI');
                }
              }

              // Sub-questions with extra indent
              drawQuestionRow(row, `    ${state.question_index}.${state.sub_question_index}) ${sq.question}${subReply}`);
              row++;

              if (row < MAX_ROWS) {
                state.sub_question_index++;
                state.sq_idx++;
              }
            }

            if (row < MAX_ROWS) {
              state.sq_idx = 0;
            }
          }

          if (row < MAX_ROWS) {
            state.pr_idx++;
          }
        }

        if (row < MAX_ROWS) {
          state.pr_idx = 0;
          state.question_index++;
          state.q_idx++;
        }
      }

      if (row < MAX_ROWS) {
        state.q_idx = 0;
        state.ta_idx++;
      }
    }

    // Flatten the form (for page 1 fields if any)
    form.flatten();

    // Return true if we need another page
    return row >= MAX_ROWS;
  }

  /**
   * Calculate pregnancy statistics
   */
  _calculatePregnancyStats(gravidanceTypes) {
    const stats = { natural: 0, cesarean: 0, abortion: 0 };

    if (!gravidanceTypes) return stats;

    gravidanceTypes.forEach(gt => {
      switch (gt.natur) {
        case 'nat':
          stats.natural++;
          break;
        case 'cae':
          stats.cesarean++;
          break;
        case 'abo':
          stats.abortion++;
          break;
      }
    });

    return stats;
  }
}

module.exports = new PDFService();
