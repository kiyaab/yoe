import { Markup } from 'telegraf';
import { TicketStatus } from '@prisma/client';

export class BotKeyboards {
  static mainMenu() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🎟 Buy Number', 'buy_page_0')],
      [
        Markup.button.callback('📊 Current Draw', 'view_current_draw'),
        Markup.button.callback('🎟 My Ticket', 'view_my_tickets'),
      ],
      [
        Markup.button.callback('💳 Payment Status', 'view_payment_status'),
        Markup.button.callback('🏆 Winners', 'view_winners'),
      ],
      [
        Markup.button.callback('📖 How It Works', 'view_how_it_works'),
        Markup.button.callback('📜 Rules', 'view_rules'),
      ],
      [Markup.button.callback('📞 Support', 'view_support')],
    ]);
  }

  static buyPagination(page: number, ticketsMap: Map<number, TicketStatus>) {
    const pageSize = 20;
    const totalPages = 10;
    const startNum = page * pageSize + 1;
    const endNum = Math.min(200, startNum + pageSize - 1);

    const rows: any[][] = [];
    let currentRow: any[] = [];

    for (let i = startNum; i <= endNum; i++) {
      const status = ticketsMap.get(i);
      const isAvailable = status === TicketStatus.AVAILABLE;
      const label = isAvailable ? `${String(i).padStart(2, '0')}` : `❌ ${i}`;
      const callbackData = isAvailable ? `pick_num_${i}` : `num_taken_${i}`;

      currentRow.push(Markup.button.callback(label, callbackData));
      if (currentRow.length === 5) {
        rows.push(currentRow);
        currentRow = [];
      }
    }
    if (currentRow.length > 0) rows.push(currentRow);

    // Nav row
    const navRow: any[] = [];
    if (page > 0) {
      navRow.push(Markup.button.callback('⬅️ Prev', `buy_page_${page - 1}`));
    }
    navRow.push(Markup.button.callback(`Page ${page + 1}/${totalPages}`, 'noop'));
    if (page < totalPages - 1) {
      navRow.push(Markup.button.callback('Next ➡️', `buy_page_${page + 1}`));
    }
    rows.push(navRow);

    // Bottom row
    rows.push([Markup.button.callback('🏠 Main Menu', 'main_menu')]);

    return Markup.inlineKeyboard(rows);
  }

  static numberConfirmation(ticketNumber: number) {
    const page = Math.floor((ticketNumber - 1) / 20);
    return Markup.inlineKeyboard([
      [Markup.button.callback('✅ Continue', `confirm_num_${ticketNumber}`)],
      [
        Markup.button.callback('🔄 Choose Another', `buy_page_${page}`),
        Markup.button.callback('❌ Cancel', 'main_menu'),
      ],
    ]);
  }

  static paymentMethod(ticketId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🏦 CBE', `pay_method_CBE_${ticketId}`),
        Markup.button.callback('📱 Telebirr', `pay_method_TELEBIRR_${ticketId}`),
      ],
      [Markup.button.callback('❌ Cancel Selection', `cancel_ticket_${ticketId}`)],
    ]);
  }

  static uploadReceipt(ticketId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('📤 Upload Receipt', `upload_prompt_${ticketId}`)],
      [Markup.button.callback('🏠 Main Menu', 'main_menu')],
    ]);
  }

  static backToMenu() {
    return Markup.inlineKeyboard([[Markup.button.callback('🏠 Main Menu', 'main_menu')]]);
  }

  static backToMenuWithRefresh(refreshAction: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🔄 Refresh', refreshAction),
        Markup.button.callback('🏠 Main Menu', 'main_menu'),
      ],
    ]);
  }

  // Admin Keyboards
  static adminMainMenu() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📊 Dashboard', 'adm_dashboard'),
        Markup.button.callback('💳 Pending Payments', 'adm_pending_payments'),
      ],
      [
        Markup.button.callback('🎟 Tickets', 'adm_tickets_menu'),
        Markup.button.callback('👥 Users', 'adm_users_menu'),
      ],
      [
        Markup.button.callback('🎡 Lottery', 'adm_lottery_menu'),
        Markup.button.callback('🏆 Winners', 'adm_winners_menu'),
      ],
      [
        Markup.button.callback('📢 Broadcast', 'adm_broadcast_menu'),
        Markup.button.callback('⚙️ Settings', 'adm_settings_menu'),
      ],
      [
        Markup.button.callback('📜 Audit Logs', 'adm_audit_menu'),
        Markup.button.callback('🏠 Main Menu', 'main_menu'),
      ],
    ]);
  }

  static adminPaymentReview(paymentId: string, userId: string, ticketId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ APPROVE', `adm_appr_${paymentId}`),
        Markup.button.callback('❌ REJECT', `adm_rej_menu_${paymentId}`),
      ],
      [
        Markup.button.callback('👤 User Details', `adm_user_${userId}`),
        Markup.button.callback('🎟 Ticket Details', `adm_ticket_${ticketId}`),
      ],
    ]);
  }

  static adminRejectReasons(paymentId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('❌ Wrong Amount', `adm_rej_act_${paymentId}_Wrong_Amount`),
        Markup.button.callback('❌ Invalid Receipt', `adm_rej_act_${paymentId}_Invalid_Receipt`),
      ],
      [
        Markup.button.callback('❌ Duplicate Receipt', `adm_rej_act_${paymentId}_Duplicate_Receipt`),
        Markup.button.callback('❌ Unreadable Receipt', `adm_rej_act_${paymentId}_Unreadable_Receipt`),
      ],
      [Markup.button.callback('❌ Other Reason', `adm_rej_act_${paymentId}_Other`)],
      [Markup.button.callback('⬅️ Back to Review', `adm_review_back_${paymentId}`)],
    ]);
  }

  static adminDrawConfirm(roundId: string) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🎡 START DRAW', `adm_exec_draw_${roundId}`)],
      [Markup.button.callback('❌ Cancel', 'adm_lottery_menu')],
    ]);
  }
}
