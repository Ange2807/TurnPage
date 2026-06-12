export default class Textarea extends HTMLElement {

   static props = {
      placeholder: { type: 'string', default: '', required: false },
      value: { type: 'string', default: '', required: false },
      rows: { type: 'number', default: 3 },
      maxlength: { type: 'number', default: null },
      required: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
      autoGrow: { type: 'boolean', default: false },
      conditions: { type: 'object', default: null },
      onChange: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.$container = this.querySelector('.slice_textarea');
      this.$textarea = this.querySelector('textarea');
      this.$placeholder = this.querySelector('.slice_textarea_placeholder');

      slice.controller.setComponentProps(this, props);
   }

   init() {
      if (this.placeholder) {
         this.$placeholder.textContent = this.placeholder;
         // The floating label is not associated via `for`, so expose it to AT here too.
         this.$textarea.setAttribute('aria-label', this.placeholder);
      }

      if (this.value) {
         this.$textarea.value = this.value;
         this.updateState();
      }

      this.$textarea.disabled = this.disabled;
      if (this.required) this.$container.classList.add('required');
      if (this.conditions) this.setupConditions();
      if (this._autoGrow) {
         this.$textarea.style.resize = 'none';
         this.grow();
      }

      // Live state: float the label, run auto-grow, surface the value via onChange.
      this.$textarea.addEventListener('input', () => {
         this.updateState();
         if (this._autoGrow) this.grow();
         if (typeof this._onChange === 'function') this._onChange(this.$textarea.value);
      });

      // Clicking the label or the padded container focuses the field (label has no `for`).
      this.$placeholder.addEventListener('click', () => this.$textarea.focus());
      this.$container.addEventListener('click', () => this.$textarea.focus());

      this.$textarea.addEventListener('focus', () => {
         this.$placeholder.classList.add('slice_textarea_focus');
      });
      this.$textarea.addEventListener('blur', () => {
         this.$placeholder.classList.remove('slice_textarea_focus');
      });
   }

   setupConditions() {
      const { regex, minLength = 0, maxLength = Infinity } = this.conditions;
      this._validator = regex
         ? new RegExp(regex)
         : { minLength, maxLength };
   }

   grow() {
      // Reset to measure the true content height, then match it.
      this.$textarea.style.height = 'auto';
      this.$textarea.style.height = `${this.$textarea.scrollHeight}px`;
   }

   updateState() {
      if (this.$textarea.value !== '') {
         this.$placeholder.classList.add('slice_textarea_value');
         this.triggerSuccess();
      } else {
         this.$placeholder.classList.remove('slice_textarea_value');
         if (this.required) this.triggerError();
      }
   }

   validateValue() {
      const v = this.$textarea.value;
      let ok = true;
      if (this._validator instanceof RegExp) {
         ok = this._validator.test(v);
      } else if (this._validator) {
         ok = v.length >= this._validator.minLength && v.length <= this._validator.maxLength;
      }
      if (ok) {
         this.triggerSuccess();
      } else {
         this.triggerError();
      }
      return ok;
   }

   clear() {
      if (this.$textarea.value !== '') {
         this.$textarea.value = '';
         this.$placeholder.className = 'slice_textarea_placeholder';
         if (this._autoGrow) this.grow();
      }
   }

   triggerSuccess() {
      this.$container.classList.remove('required', 'error');
   }

   triggerError() {
      this.$container.classList.add('error', 'required');
      setTimeout(() => {
         this.$container.classList.remove('error');
      }, 500);
   }

   get value() {
      return this.$textarea.value;
   }
   set value(newValue) {
      this.$textarea.value = newValue ?? '';
      this.updateState();
      if (this._autoGrow) this.grow();
   }

   get placeholder() {
      return this._placeholder;
   }
   set placeholder(value) {
      this._placeholder = value;
      if (this.$placeholder) this.$placeholder.textContent = value;
      if (this.$textarea && value) this.$textarea.setAttribute('aria-label', value);
   }

   get rows() {
      return this._rows;
   }
   set rows(value) {
      this._rows = value;
      if (this.$textarea && value) this.$textarea.rows = value;
   }

   get maxlength() {
      return this._maxlength;
   }
   set maxlength(value) {
      this._maxlength = value;
      if (this.$textarea && value != null) this.$textarea.maxLength = value;
   }

   get required() {
      return this._required;
   }
   set required(value) {
      this._required = value;
      if (this.$container) this.$container.classList.toggle('required', value);
   }

   get disabled() {
      return this._disabled;
   }
   set disabled(value) {
      this._disabled = value;
      if (this.$textarea) this.$textarea.disabled = value;
      if (this.$container) this.$container.classList.toggle('disabled', value);
   }

   get autoGrow() {
      return this._autoGrow;
   }
   set autoGrow(value) {
      this._autoGrow = value;
      if (this.$textarea && value) {
         this.$textarea.style.resize = 'none';
         this.grow();
      }
   }

   get conditions() {
      return this._conditions;
   }
   set conditions(value) {
      this._conditions = value;
      if (value) this.setupConditions();
   }

   get onChange() {
      return this._onChange;
   }
   set onChange(fn) {
      if (typeof fn === 'function') this._onChange = fn;
   }
}

customElements.define('slice-textarea', Textarea);
