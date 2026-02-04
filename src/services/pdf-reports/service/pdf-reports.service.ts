import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Injectable } from '@nestjs/common'
import { ScholarshipService } from '../../..//modules/scholarship/service/scholarship.service'
import {
  HEADERS_FOR_SCHOLARSHIPS_STARTING_CURRENT_YEAR,
  HEADERS_FOR_SCHOLARSHIPS_ENDING_CURRENT_YEAR,
  getFirstAndLastNameFromCompleteName,
  getScholarshipsSplitedByStartingYear,
  getScholarshipsSplitedByEndingYear
} from './pdf-reports.helper'
import { QuadrennialReportDto } from '../dtos/quadrennial-report.dto'

@Injectable()
export class PdfReportService {
  constructor(private scholarshipService: ScholarshipService) {}

  _createRowsByStartingYear(scholarships) {
    const result = []

    scholarships.sort((a, b) => {
      const dateA = new Date(a.scholarship_starts_at).getTime()
      const dateB = new Date(b.scholarship_starts_at).getTime()
      return dateA - dateB
    })

    for (const scholarship of scholarships) {
      const data = {
        agency: scholarship.agency.name,
        course: scholarship.enrollment.enrollment_program,
        student_name: getFirstAndLastNameFromCompleteName(
          scholarship.enrollment.student.name
        ),
        advisor_name: getFirstAndLastNameFromCompleteName(
          scholarship.enrollment.advisor.name
        ),
        starting_date: new Date(
          scholarship.scholarship_starts_at
        ).toLocaleDateString('pt-BR')
      }

      result.push(Object.assign({}, data))
    }

    return result
  }

  _createRowsByEndingYear(scholarships) {
    const result = []

    scholarships.sort((a, b) => {
      const dateA = new Date(a.scholarship_ends_at).getTime()
      const dateB = new Date(b.scholarship_ends_at).getTime()
      return dateA - dateB
    })

    for (const scholarship of scholarships) {
      const data = {
        agency: scholarship.agency.name,
        course: scholarship.enrollment.enrollment_program,
        student_name: getFirstAndLastNameFromCompleteName(
          scholarship.enrollment.student.name
        ),
        advisor_name: getFirstAndLastNameFromCompleteName(
          scholarship.enrollment.advisor.name
        ),
        ending_date: new Date(
          scholarship.scholarship_ends_at
        ).toLocaleDateString('pt-BR')
      }

      result.push(Object.assign({}, data))
    }

    return result
  }

  async generatePDF(): Promise<ArrayBuffer> {
    const scholarships = await this.scholarshipService.findAll()

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const docWidth = doc.internal.pageSize.getWidth()

    const currentYear = new Date().getFullYear()
    const previousYear = currentYear - 1
    const currentYearStr = currentYear.toString()
    const previousYearStr = previousYear.toString()

    const scholarshipsByStartingYear =
      getScholarshipsSplitedByStartingYear(scholarships)
    const scholarshipsStartingOnCurrentYear =
      scholarshipsByStartingYear[currentYearStr]
    const scholarshipsStartingOnPreviousYear =
      scholarshipsByStartingYear[previousYearStr]

    const scholarshipsByEndingYear =
      getScholarshipsSplitedByEndingYear(scholarships)
    const scholarshipsEndingOnCurrentYear =
      scholarshipsByEndingYear[currentYearStr]
    const scholarshipsEndingOnPreviousYear =
      scholarshipsByEndingYear[previousYearStr]

    doc
      .setFontSize(18)
      .setFont('times', 'bold')
      .text(
        `RELATÓRIO DE BOLSAS DO PGCOMP - ${currentYear}`,
        docWidth / 2,
        30,
        {
          align: 'center'
        }
      )

    doc.line(30, 32, docWidth - 30, 32, 'S').setLineWidth(1)

    doc
      .setFontSize(10)
      .setFont('times', 'bold')
      .text(
        `Emitido em ${new Date().toLocaleString('pt-BR')}`,
        docWidth - 30,
        37,
        {
          align: 'right'
        }
      )

    doc
      .setFontSize(12)
      .setFont('times', 'bold')
      .text(`BOLSAS INICIADAS ESTE ANO`, 30, 50, {
        align: 'justify'
      })

    if (!scholarshipsStartingOnCurrentYear) {
      doc
        .setFont('times', 'normal')
        .text(
          '\u2022 ' + `Nenhuma bolsa foi pleiteada no ano de ${currentYear}.`,
          35,
          60,
          {
            align: 'justify'
          }
        )

      if (scholarshipsStartingOnPreviousYear) {
        doc.text(
          '\u2022 ' +
            `Em comparação, no ano de ${previousYear}, o PGCOMP foi contemplado com ${scholarshipsStartingOnPreviousYear.length} novos bolsistas.`,
          35,
          65,
          {
            align: 'justify'
          }
        )
      }
    } else {
      doc
        .setFontSize(12)
        .setFont('times', 'normal')
        .text(
          '\u2022 ' +
            `${scholarshipsStartingOnCurrentYear.length} novas bolsas foram pleiteadas no ano de ${currentYear}.`,
          35,
          60,
          {
            align: 'justify'
          }
        )

      if (scholarshipsStartingOnPreviousYear) {
        doc.text(
          '\u2022 ' +
            `Em comparação, no ano de ${previousYear}, o PGCOMP foi contemplado com ${scholarshipsStartingOnPreviousYear.length} novos bolsistas.`,
          35,
          65,
          {
            align: 'justify'
          }
        )
      }

      const headers = HEADERS_FOR_SCHOLARSHIPS_STARTING_CURRENT_YEAR as any

      const rows = this._createRowsByStartingYear(
        scholarshipsStartingOnCurrentYear
      )

      const margins = { top: 30, left: 20, bottom: 20, right: 25 } as any

      const positionOfStartingCurrentYearTable =
        scholarshipsStartingOnPreviousYear ? 70 : 65

      doc.table(25, positionOfStartingCurrentYearTable, rows, headers, {
        fontSize: 12,
        margins
      })
    }

    doc.addPage()

    doc
      .setFontSize(12)
      .setFont('times', 'bold')
      .text(`BOLSAS EM FINALIZAÇÃO NESTE ANO`, 30, 30, {
        align: 'justify'
      })

    if (!scholarshipsEndingOnCurrentYear) {
      doc
        .setFont('times', 'normal')
        .text(
          '\u2022 ' + `Nenhuma bolsa irá finalizar no ano de ${currentYear}.`,
          35,
          40,
          {
            align: 'justify'
          }
        )

      if (scholarshipsEndingOnPreviousYear) {
        doc.text(
          '\u2022 ' +
            `Em comparação, no ano de ${previousYear}, ${scholarshipsEndingOnPreviousYear.length} bolsas foram finalizadas no PGCOMP.`,
          35,
          45,
          {
            align: 'justify'
          }
        )
      }
    } else {
      doc
        .setFontSize(12)
        .setFont('times', 'normal')
        .text(
          '\u2022 ' +
            `${scholarshipsEndingOnCurrentYear.length} bolsas serão finalizadas no ano de ${currentYear}.`,
          35,
          40,
          {
            align: 'justify'
          }
        )

      if (scholarshipsEndingOnPreviousYear) {
        doc.text(
          '\u2022 ' +
            `Em comparação, no ano de ${previousYear}, ${scholarshipsEndingOnPreviousYear.length} bolsas foram finalizadas no PGCOMP.`,
          35,
          45,
          {
            align: 'justify'
          }
        )
      }
      const headers = HEADERS_FOR_SCHOLARSHIPS_ENDING_CURRENT_YEAR as any

      const rows = this._createRowsByEndingYear(scholarshipsEndingOnCurrentYear)

      const margins = { top: 30, left: 20, bottom: 20, right: 25 } as any

      const positionOfEndingCurrentYearTable = scholarshipsEndingOnPreviousYear
        ? 50
        : 55

      doc.table(25, positionOfEndingCurrentYearTable, rows, headers, {
        fontSize: 12,
        margins
      })
    }

    return doc.output('arraybuffer')
  }

  async generateQuadrennialPDF(
    dto: QuadrennialReportDto
  ): Promise<ArrayBuffer> {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    })

    const docWidth = doc.internal.pageSize.getWidth()
    let currentY = 20

    // Cabeçalho Principal do Relatório
    doc.setFontSize(16).setFont('times', 'bold')
    doc.text(
      'RELATÓRIO QUADRIENAL DE BOLSAS - PGCOMP',
      docWidth / 2,
      currentY,
      {
        align: 'center'
      }
    )

    currentY += 8
    doc.setFontSize(11).setFont('times', 'normal')
    doc.text(
      `Período: ${dto.startDate} até ${dto.endDate}`,
      docWidth / 2,
      currentY,
      {
        align: 'center'
      }
    )

    currentY += 10
    doc.setFontSize(10).setFont('times', 'italic')
    doc.text(
      `Emitido em: ${new Date().toLocaleString('pt-BR')}`,
      docWidth - 20,
      currentY,
      {
        align: 'right'
      }
    )

    currentY += 10

    // Iterar por cada agência para criar tabelas separadas
    dto.data.forEach((agency, index) => {
      // Verificar se a nova tabela cabe na página, senão cria nova página
      if (currentY > 215) {
        doc.addPage()
        currentY = 20
      }

      // Título da Agência (Nome da Agência)
      doc.setFontSize(12).setFont('times', 'bold')
      doc.setTextColor(237, 108, 2)
      doc.text(agency.agencyName.toUpperCase(), 14, currentY)
      doc.setTextColor(0, 0, 0)

      // Estrutura de dados
      const tableBody: any[][] = [
        ['Ativas', agency.activeCount.masters, agency.activeCount.phd],
        ['Em Andamento', agency.onGoingCount.masters, agency.onGoingCount.phd],
        ['Prorrogadas', agency.extendedCount.masters, agency.extendedCount.phd],
        ['Concluídas', agency.finishedCount.masters, agency.finishedCount.phd],
        [
          {
            content: 'TOTAL TIPO BOLSA',
            styles: { fontStyle: 'bold', fillColor: [240, 240, 240] }
          },
          {
            content: agency.totalMasters,
            styles: {
              halign: 'center',
              fontStyle: 'bold',
              fillColor: [240, 240, 240]
            }
          },
          {
            content: agency.totalPhd,
            styles: {
              halign: 'center',
              fontStyle: 'bold',
              fillColor: [240, 240, 240]
            }
          }
        ],
        [
          { content: 'TOTAL GERAL', styles: { fontStyle: 'bold' } },
          {
            content: agency.scholarshipsTotal,
            colSpan: 2,
            styles: { halign: 'center', fontStyle: 'bold' }
          }
        ]
      ]

      autoTable(doc, {
        startY: currentY + 2,
        head: [['Status da Bolsa', 'Mestrado', 'Doutorado']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [60, 60, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          font: 'times',
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 80 }, // Status
          1: { halign: 'center' }, // Mestrado
          2: { halign: 'center' } // Doutorado
        },
        margin: { left: 14, right: 14 },
        pageBreak: 'auto'
      })

      // Atualiza o Y para a próxima agência baseada no final da tabela anterior
      currentY = (doc as any).lastAutoTable.finalY + 15
    })

    return doc.output('arraybuffer')
  }
}
